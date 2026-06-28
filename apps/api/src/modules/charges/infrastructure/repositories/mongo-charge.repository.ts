import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Charge, ChargeStatus, PaymentMethod } from '@/modules/charges/domain/entities/charge.entity';
import type {
  IChargeRepository,
  ListChargesFilter,
  ListChargesResult,
} from '@/modules/charges/domain/repositories/charge-repository.interface';
import { ChargeModel, ChargeDocument } from '@/modules/charges/infrastructure/database/charge.schema';

/** Status de cobrança que ainda permitem expiração (não terminais) */
const EXPIRABLE_STATUSES: ChargeStatus[] = [
  ChargeStatus.PENDING,
  ChargeStatus.AWAITING_PAYMENT,
];

/** Tipo intermediário do documento Mongoose após .lean() */
interface ChargeLean {
  _id: string;
  customerId: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  paymentMethod: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Implementação do repositório de cobranças usando Mongoose.
 * Mapeia entre documento Mongo e entidade de domínio em ambas as direções.
 */
@Injectable()
export class MongoChargeRepository implements IChargeRepository {
  constructor(
    @InjectModel(ChargeModel.name)
    private readonly model: Model<ChargeDocument>,
  ) {}

  async create(charge: Charge): Promise<void> {
    await this.model.create(this.toPersistence(charge));
  }

  async findById(id: string): Promise<Charge | null> {
    const doc = await this.model.findById(id).lean<ChargeLean>().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAll(
    filter: ListChargesFilter | undefined,
    page: number,
    limit: number,
  ): Promise<ListChargesResult> {
    const query = this.buildQuery(filter);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.model.find(query).skip(skip).limit(limit).lean<ChargeLean[]>().exec(),
      this.model.countDocuments(query).exec(),
    ]);

    return { items: docs.map((doc) => this.toDomain(doc)), total };
  }

  async update(charge: Charge): Promise<void> {
    await this.model
      .updateOne({ _id: charge.id }, { $set: this.toPersistence(charge) })
      .exec();
  }

  async findExpirable(now: Date, limit: number): Promise<Charge[]> {
    const docs = await this.model
      .find({
        status: { $in: EXPIRABLE_STATUSES },
        expiresAt: { $lt: now },
      })
      .limit(limit)
      .lean<ChargeLean[]>()
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async countByStatus(): Promise<Record<string, number>> {
    const results = await this.model
      .aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .exec();

    return results.reduce<Record<string, number>>((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});
  }

  /** Constrói o objeto de filtro do Mongoose a partir dos critérios de listagem */
  private buildQuery(filter?: ListChargesFilter): Record<string, unknown> {
    const query: Record<string, unknown> = {};

    if (filter?.status) {
      query['status'] = filter.status;
    }

    if (filter?.customerId) {
      query['customerId'] = filter.customerId;
    }

    return query;
  }

  /** Mapeia documento Mongo → entidade de domínio */
  private toDomain(doc: ChargeLean): Charge {
    return new Charge({
      id: doc._id,
      customerId: doc.customerId,
      amount: doc.amount,
      currency: doc.currency,
      description: doc.description,
      status: doc.status as ChargeStatus,
      paymentMethod: doc.paymentMethod as PaymentMethod,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  /** Mapeia entidade de domínio → objeto de persistência Mongo */
  private toPersistence(charge: Charge): Record<string, unknown> {
    return {
      _id: charge.id,
      customerId: charge.customerId,
      amount: charge.amount,
      currency: charge.currency,
      description: charge.description,
      status: charge.status,
      paymentMethod: charge.paymentMethod,
      expiresAt: charge.expiresAt,
    };
  }
}
