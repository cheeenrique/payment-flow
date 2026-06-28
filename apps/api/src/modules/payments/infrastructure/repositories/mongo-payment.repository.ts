import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, type PaymentMethod, type PaymentStatus } from '@/modules/payments/domain/entities/payment.entity';
import type { IPaymentRepository } from '@/modules/payments/domain/repositories/payment-repository.interface';
import { PaymentModel, type PaymentDocument } from '@/modules/payments/infrastructure/database/payment.schema';

/** Forma lean retornada pelo Mongoose (sem métodos de documento) */
interface PaymentLean {
  _id: string;
  chargeId: string;
  customerId: string;
  amount: number;
  method: string;
  status: string;
  idempotencyKey?: string;
  providerResponse?: Record<string, unknown>;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Implementação MongoDB do repositório de Payments.
 * Responsável apenas por persistência — sem regras de negócio.
 */
@Injectable()
export class MongoPaymentRepository implements IPaymentRepository {
  constructor(
    @InjectModel(PaymentModel.name)
    private readonly model: Model<PaymentDocument>,
  ) {}

  async create(payment: Payment): Promise<void> {
    await this.model.create(this.toPersistence(payment));
  }

  async findById(id: string): Promise<Payment | null> {
    const doc = await this.model.findById(id).lean<PaymentLean>().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async update(payment: Payment): Promise<void> {
    await this.model
      .updateOne({ _id: payment.id }, { $set: this.toPersistence(payment) })
      .exec();
  }

  async findByChargeId(
    chargeId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Payment[]; total: number }> {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find({ chargeId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<PaymentLean[]>()
        .exec(),
      this.model.countDocuments({ chargeId }).exec(),
    ]);
    return { items: docs.map((doc) => this.toDomain(doc)), total };
  }

  async findByIdempotencyKey(key: string): Promise<Payment | null> {
    const doc = await this.model
      .findOne({ idempotencyKey: key })
      .lean<PaymentLean>()
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  /** Converte documento Mongoose para entidade de domínio */
  private toDomain(doc: PaymentLean): Payment {
    return new Payment({
      id: doc._id,
      chargeId: doc.chargeId,
      customerId: doc.customerId,
      amount: doc.amount,
      method: doc.method as PaymentMethod,
      status: doc.status as PaymentStatus,
      idempotencyKey: doc.idempotencyKey,
      providerResponse: doc.providerResponse,
      failureReason: doc.failureReason,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  /** Converte entidade de domínio para estrutura de persistência */
  private toPersistence(payment: Payment): Record<string, unknown> {
    return {
      _id: payment.id,
      chargeId: payment.chargeId,
      customerId: payment.customerId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      idempotencyKey: payment.idempotencyKey,
      providerResponse: payment.providerResponse,
      failureReason: payment.failureReason,
    };
  }
}
