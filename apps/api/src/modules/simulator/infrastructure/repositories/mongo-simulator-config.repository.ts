import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SimulatorConfig } from '@/modules/simulator/domain/entities/simulator-config.entity';
import type { ISimulatorConfigRepository } from '@/modules/simulator/domain/repositories/simulator-config-repository.interface';
import { SimulatorConfigModel, SimulatorConfigDocument } from '@/modules/simulator/infrastructure/database/simulator-config.schema';

/** Tipo lean retornado pelo Mongoose — nunca exposto fora da infra */
interface SimulatorConfigLean {
  _id: string;
  pix: { successRate: number; maxDelayMs: number };
  boleto: { delayMs: number; successRate: number };
  creditCard: { successRate: number; riskFactor: number };
  updatedAt: Date;
}

/**
 * Implementação Mongoose do repositório de configuração do simulador.
 * Usa upsert para garantir que sempre exista no máximo um documento ('global').
 */
@Injectable()
export class MongoSimulatorConfigRepository implements ISimulatorConfigRepository {
  constructor(
    @InjectModel(SimulatorConfigModel.name)
    private readonly model: Model<SimulatorConfigDocument>,
  ) {}

  async findGlobal(): Promise<SimulatorConfig | null> {
    const doc = await this.model
      .findById(SimulatorConfig.GLOBAL_ID)
      .lean<SimulatorConfigLean>()
      .exec();

    return doc ? this.toDomain(doc) : null;
  }

  async upsert(config: SimulatorConfig): Promise<void> {
    await this.model.findByIdAndUpdate(
      config.id,
      { $set: this.toPersistence(config) },
      { upsert: true, new: true },
    );
  }

  // ─── Mapeamento infra ↔ domínio ─────────────────────────────────────────────

  private toDomain(doc: SimulatorConfigLean): SimulatorConfig {
    return new SimulatorConfig({
      id: doc._id,
      pix: { successRate: doc.pix.successRate, maxDelayMs: doc.pix.maxDelayMs },
      boleto: { delayMs: doc.boleto.delayMs, successRate: doc.boleto.successRate },
      creditCard: { successRate: doc.creditCard.successRate, riskFactor: doc.creditCard.riskFactor },
      updatedAt: doc.updatedAt,
    });
  }

  private toPersistence(config: SimulatorConfig): Record<string, unknown> {
    return {
      _id: config.id,
      pix: config.pix,
      boleto: config.boleto,
      creditCard: config.creditCard,
    };
  }
}
