import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';
import { ChargeNotFoundError } from '@/modules/charges/domain/errors/charge-not-found.error';
import { CHARGE_REPOSITORY } from '@/modules/charges/charges.tokens';

/** Request enriquecido com chargeId resolvido pelo LinkTokenGuard */
export type RequestWithChargeId = Request & { chargeId: string };

/**
 * Guard público — valida o token do link de pagamento via repositório.
 * Não usa JWT: o token opaco do link é a própria credencial de acesso ao checkout.
 *
 * Ao passar, anexa `chargeId` ao request para uso direto no handler SSE,
 * evitando uma segunda consulta ao banco no controller.
 *
 * Token inexistente → ChargeNotFoundError (404 via GlobalExceptionFilter).
 */
@Injectable()
export class LinkTokenGuard implements CanActivate {
  constructor(
    @Inject(CHARGE_REPOSITORY) private readonly chargeRepo: IChargeRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithChargeId>();
    const rawToken = request.params['token'];
    const token = typeof rawToken === 'string' ? rawToken : '';

    const charge = await this.chargeRepo.findByPaymentLinkToken(token);

    if (!charge) {
      throw new ChargeNotFoundError(token);
    }

    request.chargeId = charge.id;
    return true;
  }
}
