import { Inject, Injectable } from '@nestjs/common';
import { SimulatorConfig } from '@/modules/simulator/domain/entities/simulator-config.entity';
import type { PixRules, BoletoRules, CreditCardRules } from '@/modules/simulator/domain/entities/simulator-config.entity';
import type { ISimulatorConfigRepository } from '@/modules/simulator/domain/repositories/simulator-config-repository.interface';
import { SIMULATOR_CONFIG_REPOSITORY } from '@/modules/simulator/simulator.tokens';

/** Campos permitidos para atualização parcial da configuração */
export interface UpdateSimulatorConfigInput {
  pix?: PixRules;
  boleto?: BoletoRules;
  creditCard?: CreditCardRules;
}

/**
 * Atualiza parcialmente as regras de simulação.
 * Campos omitidos mantêm o valor atual (merge não-destrutivo).
 * Se não houver configuração prévia, parte dos valores padrão.
 */
@Injectable()
export class UpdateSimulatorConfigUseCase {
  constructor(
    @Inject(SIMULATOR_CONFIG_REPOSITORY)
    private readonly repo: ISimulatorConfigRepository,
  ) {}

  async execute(input: UpdateSimulatorConfigInput): Promise<SimulatorConfig> {
    const current = await this.repo.findGlobal() ?? SimulatorConfig.createDefault();
    const updated = current.withUpdates(input);
    await this.repo.upsert(updated);
    return updated;
  }
}
