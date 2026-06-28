import { Inject, Injectable } from '@nestjs/common';
import { SimulatorConfig } from '@/modules/simulator/domain/entities/simulator-config.entity';
import type { ISimulatorConfigRepository } from '@/modules/simulator/domain/repositories/simulator-config-repository.interface';
import { SIMULATOR_CONFIG_REPOSITORY } from '@/modules/simulator/simulator.tokens';

/**
 * Recupera a configuração global do simulador.
 * Retorna os valores padrão de fábrica se ainda não houver registro persistido.
 */
@Injectable()
export class GetSimulatorConfigUseCase {
  constructor(
    @Inject(SIMULATOR_CONFIG_REPOSITORY)
    private readonly repo: ISimulatorConfigRepository,
  ) {}

  async execute(): Promise<SimulatorConfig> {
    const config = await this.repo.findGlobal();
    return config ?? SimulatorConfig.createDefault();
  }
}
