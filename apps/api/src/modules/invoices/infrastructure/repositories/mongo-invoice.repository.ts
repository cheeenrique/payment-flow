import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { IInvoiceRepository } from '@/modules/invoices/domain/repositories/invoice-repository.interface';
import { Invoice } from '@/modules/invoices/domain/entities/invoice.entity';
import type { InvoiceStatus } from '@/modules/invoices/domain/entities/invoice.entity';
import { InvoiceModel, InvoiceDocument } from '@/modules/invoices/infrastructure/database/invoice.schema';

/** Formato lean retornado pelo Mongoose (sem métodos de documento) */
interface InvoiceLean {
  _id: string;
  paymentId: string;
  chargeId: string;
  customerId: string;
  amount: number;
  status: string;
  issuedAt: Date | null;
  externalReference: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MongoInvoiceRepository implements IInvoiceRepository {
  constructor(
    @InjectModel(InvoiceModel.name)
    private readonly model: Model<InvoiceDocument>,
  ) {}

  async create(invoice: Invoice): Promise<void> {
    await this.model.create({
      _id: invoice.id,
      paymentId: invoice.paymentId,
      chargeId: invoice.chargeId,
      customerId: invoice.customerId,
      amount: invoice.amount,
      status: invoice.status,
      issuedAt: invoice.issuedAt,
      externalReference: invoice.externalReference,
    });
  }

  async save(invoice: Invoice): Promise<void> {
    await this.model.updateOne(
      { _id: invoice.id },
      {
        $set: {
          status: invoice.status,
          issuedAt: invoice.issuedAt,
          externalReference: invoice.externalReference,
          updatedAt: invoice.updatedAt,
        },
      },
    );
  }

  async findById(id: string): Promise<Invoice | null> {
    const doc = await this.model.findById(id).lean<InvoiceLean>().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByPaymentId(paymentId: string): Promise<Invoice | null> {
    const doc = await this.model.findOne({ paymentId }).lean<InvoiceLean>().exec();
    return doc ? this.toDomain(doc) : null;
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

  /** Mapeia documento Mongoose → entidade de domínio (sem vazar infra para o domínio) */
  private toDomain(doc: InvoiceLean): Invoice {
    return new Invoice({
      id: doc._id,
      paymentId: doc.paymentId,
      chargeId: doc.chargeId,
      customerId: doc.customerId,
      amount: doc.amount,
      status: doc.status as InvoiceStatus,
      issuedAt: doc.issuedAt,
      externalReference: doc.externalReference,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
