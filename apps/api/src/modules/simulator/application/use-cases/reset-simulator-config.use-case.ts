import { Inject, Injectable } from '@nestjs/common';
import { SimulatorConfig } from '@/modules/simulator/domain/entities/simulator-config.entity';
import type { ISimulatorConfigRepository } from '@/modules/simulator/domain/repositories/simulator-config-repository.interface';
import { SIMULATOR_CONFIG_REPOSITORY } from '@/modules/simulator/simulator.tokens';

/**
 * Restaura as regras de simulação para os valores padrão de fábrica.
 * Operação destrutiva — sobrescreve qualquer configuração prévia.
 */
@Injectable()
export class ResetSimulatorConfigUseCase {
  constructor(
    @Inject(SIMULATOR_CONFIG_REPOSITORY)
    private readonly repo: ISimulatorConfigRepository,
  ) {}

  async execute(): Promise<SimulatorConfig> {
    const defaults = SimulatorConfig.createDefault();
    await this.repo.upsert(defaults);
    return defaults;
  }
}
