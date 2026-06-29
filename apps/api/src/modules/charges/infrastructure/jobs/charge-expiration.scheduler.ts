import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';
import { ExpireChargeUseCase } from '@/modules/charges/application/use-cases/expire-charge.use-case';
import { ChargeCannotExpireError } from '@/modules/charges/domain/errors/charge-cannot-expire.error';
import { ChargeNotFoundError } from '@/modules/charges/domain/errors/charge-not-found.error';
import { CHARGE_REPOSITORY } from '@/modules/charges/charges.tokens';

/**
 * Scheduler de expiração de cobranças.
 *
 * Roda a cada minuto e busca cobranças abertas (pending/awaiting_payment)
 * cujo prazo já venceu. Para cada uma, delega para ExpireChargeUseCase,
 * que persiste o estado e publica charge.expired.v1.
 *
 * Idempotência: caso a cobrança já tenha transitado para estado terminal
 * entre a consulta e o processamento, ChargeCannotExpireError é capturado
 * e o item é ignorado silenciosamente.
 *
 * Limite de lote: 100 cobranças por execução. Se o lote estiver cheio,
 * um aviso é emitido — indica acúmulo que pode requerer ajuste de intervalo.
 */
@Injectable()
export class ChargeExpirationScheduler {
  private readonly logger = new Logger(ChargeExpirationScheduler.name);

  /** Tamanho máximo do lote por execução — evita varredura irrestrita */
  private static readonly BATCH_LIMIT = 100;

  constructor(
    @Inject(CHARGE_REPOSITORY) private readonly chargeRepo: IChargeRepository,
    private readonly expireChargeUseCase: ExpireChargeUseCase,
  ) {}

  /**
   * Executa a cada minuto.
   * Hardcoded: intervalo adequado para o projeto; ajustar via ConfigService
   * se a frequência precisar ser configurável por ambiente.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async expireOverdueCharges(): Promise<void> {
    const now = new Date();
    const charges = await this.chargeRepo.findExpirable(
      now,
      ChargeExpirationScheduler.BATCH_LIMIT,
    );

    if (charges.length === 0) return;

    if (charges.length === ChargeExpirationScheduler.BATCH_LIMIT) {
      this.logger.warn(
        `Lote de expiração truncado em ${ChargeExpirationScheduler.BATCH_LIMIT} cobranças ` +
          `— possível acúmulo, verificar intervalo do cron`,
      );
    }

    this.logger.log(`Expirando ${charges.length} cobrança(s) vencida(s)`);

    // Processa em paralelo; Promise.allSettled garante que uma falha não
    // interrompe o restante do lote
    const resultados = await Promise.allSettled(
      charges.map((charge) => this.expireOne(charge.id)),
    );

    const falhas = resultados.filter((r) => r.status === 'rejected').length;
    if (falhas > 0) {
      this.logger.error(`${falhas} cobrança(s) falharam na expiração deste lote`);
    }
  }

  /** Expira uma cobrança individual, tratando race conditions de forma idempotente */
  private async expireOne(chargeId: string): Promise<void> {
    try {
      await this.expireChargeUseCase.execute(chargeId);
      this.logger.log(`Cobrança expirada pelo scheduler: chargeId=${chargeId}`);
    } catch (err: unknown) {
      // Race condition: outra transição (ex: pagamento aprovado) ocorreu entre
      // a consulta e a expiração — comportamento esperado, não é erro real
      if (err instanceof ChargeCannotExpireError || err instanceof ChargeNotFoundError) {
        this.logger.warn(
          `Cobrança ignorada pelo scheduler (já transitada): chargeId=${chargeId} — ${err.message}`,
        );
        return;
      }

      this.logger.error(
        `Falha inesperada ao expirar cobrança: chargeId=${chargeId}`,
        err instanceof Error ? err.stack : String(err),
      );

      // Relança para que Promise.allSettled contabilize como rejected
      throw err;
    }
  }
}
