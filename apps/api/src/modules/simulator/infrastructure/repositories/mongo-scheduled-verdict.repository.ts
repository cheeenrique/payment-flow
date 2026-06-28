import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ScheduledVerdict,
  type VerdictOutcome,
  type VerdictStatus,
} from '@/modules/simulator/domain/entities/scheduled-verdict.entity';
import type { IScheduledVerdictRepository } from '@/modules/simulator/domain/repositories/scheduled-verdict-repository.interface';
import {
  ScheduledVerdictModel,
  type ScheduledVerdictDocument,
} from '@/modules/simulator/infrastructure/database/scheduled-verdict.schema';
import type { SimulatorFailureReason } from '@/modules/simulator/domain/events/simulator-payment-failed.event';

/** Tipo lean retornado pelo Mongoose — nunca exposto fora da infra */
interface ScheduledVerdictLean {
  _id: string;
  paymentId: string;
  correlationId: string;
  paymentMethod: string;
  outcome: VerdictOutcome;
  failureReason?: SimulatorFailureReason;
  dueAt: Date;
  status: VerdictStatus;
  createdAt: Date;
}

/**
 * Implementação Mongoose do repositório de vereditos agendados.
 *
 * A unicidade em `paymentId` é garantida por índice único no schema —
 * este repositório trata MongoServerError 11000 (duplicate key) de forma
 * silenciosa: se já existe, o método save() ignora (idempotência).
 */
@Injectable()
export class MongoScheduledVerdictRepository implements IScheduledVerdictRepository {
  constructor(
    @InjectModel(ScheduledVerdictModel.name)
    private readonly model: Model<ScheduledVerdictDocument>,
  ) {}

  async save(verdict: ScheduledVerdict): Promise<void> {
    await this.model.create({
      _id: verdict.id,
      paymentId: verdict.paymentId,
      correlationId: verdict.correlationId,
      paymentMethod: verdict.paymentMethod,
      outcome: verdict.outcome,
      failureReason: verdict.failureReason,
      dueAt: verdict.dueAt,
      status: verdict.status,
      createdAt: verdict.createdAt,
    });
  }

  async findDue(now: Date, limit: number): Promise<ScheduledVerdict[]> {
    const docs = await this.model
      .find({ status: 'pending', dueAt: { $lte: now } })
      .limit(limit)
      .lean<ScheduledVerdictLean[]>()
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async markProcessed(id: string): Promise<void> {
    await this.model
      .findByIdAndUpdate(id, { $set: { status: 'processed' } })
      .exec();
  }

  async existsByPaymentId(paymentId: string): Promise<boolean> {
    const count = await this.model.countDocuments({ paymentId }).exec();
    return count > 0;
  }

  // ─── Mapeamento infra ↔ domínio ─────────────────────────────────────────────

  private toDomain(doc: ScheduledVerdictLean): ScheduledVerdict {
    return new ScheduledVerdict({
      id: doc._id,
      paymentId: doc.paymentId,
      correlationId: doc.correlationId,
      paymentMethod: doc.paymentMethod,
      outcome: doc.outcome,
      failureReason: doc.failureReason,
      dueAt: doc.dueAt,
      status: doc.status,
      createdAt: doc.createdAt,
    });
  }
}
