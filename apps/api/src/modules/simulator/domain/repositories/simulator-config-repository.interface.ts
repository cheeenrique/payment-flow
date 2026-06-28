// Porta de persistência para a configuração do simulador.
// O domínio depende desta interface; a infra a implementa (DIP).
import type { SimulatorConfig } from '@/modules/simulator/domain/entities/simulator-config.entity';

export interface ISimulatorConfigRepository {
  /** Retorna a configuração global singleton, ou null caso ainda não exista */
  findGlobal(): Promise<SimulatorConfig | null>;
  /** Cria ou atualiza (upsert) a configuração global */
  upsert(config: SimulatorConfig): Promise<void>;
}
