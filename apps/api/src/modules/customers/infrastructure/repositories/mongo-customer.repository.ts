import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Customer, CustomerStatus } from '@/modules/customers/domain/entities/customer.entity';
import type {
  ICustomerRepository,
  ListCustomersParams,
  ListCustomersResult,
} from '@/modules/customers/domain/repositories/customer-repository.interface';
import { CustomerModel, CustomerDocument } from '@/modules/customers/infrastructure/database/customer.schema';

/** Forma plana (lean) do documento Mongoose para tipagem interna */
interface CustomerLean {
  _id: string;
  name: string;
  email: string;
  document: string;
  phone?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Implementação MongoDB do repositório de clientes.
 * Mapeia explicitamente documento ↔ entidade de domínio;
 * o domínio nunca vê Mongoose nem ObjectId.
 */
@Injectable()
export class MongoCustomerRepository implements ICustomerRepository {
  constructor(
    @InjectModel(CustomerModel.name)
    private readonly model: Model<CustomerDocument>,
  ) {}

  async create(customer: Customer): Promise<void> {
    await this.model.create({
      _id: customer.id,
      name: customer.name,
      email: customer.email,
      document: customer.document,
      phone: customer.phone,
      status: customer.status,
    });
  }

  async findById(id: string): Promise<Customer | null> {
    const doc = await this.model.findById(id).lean<CustomerLean>().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const doc = await this.model
      .findOne({ email: email.toLowerCase() })
      .lean<CustomerLean>()
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async update(customer: Customer): Promise<void> {
    await this.model
      .updateOne(
        { _id: customer.id },
        {
          $set: {
            name: customer.name,
            document: customer.document,
            phone: customer.phone,
            status: customer.status,
            updatedAt: customer.updatedAt,
          },
        },
      )
      .exec();
  }

  async list(params: ListCustomersParams): Promise<ListCustomersResult> {
    const skip = (params.page - 1) * params.limit;

    const [docs, total] = await Promise.all([
      this.model
        .find()
        .skip(skip)
        .limit(params.limit)
        .lean<CustomerLean[]>()
        .exec(),
      this.model.countDocuments().exec(),
    ]);

    return { items: docs.map((d) => this.toDomain(d)), total };
  }

  /** Converte documento Mongoose para entidade de domínio */
  private toDomain(doc: CustomerLean): Customer {
    return new Customer({
      id: doc._id,
      name: doc.name,
      email: doc.email,
      document: doc.document,
      phone: doc.phone,
      status: doc.status as CustomerStatus,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
