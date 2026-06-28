import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TimelineEvent, AggregateType } from '@/modules/timeline/domain/entities/timeline-event.entity';
import type { ITimelineEventRepository } from '@/modules/timeline/domain/repositories/timeline-event-repository.interface';
import {
  TimelineEventModel,
  TimelineEventDocument,
} from '@/modules/timeline/infrastructure/database/timeline-event.schema';

/** Tipo lean para evitar overhead do HydratedDocument na leitura */
interface TimelineEventLean {
  _id: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: Record<string, unknown>;
  correlationId: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

/**
 * Implementação Mongoose do repositório de timeline.
 * Domínio não conhece esta classe — acessa apenas via ITimelineEventRepository.
 */
@Injectable()
export class MongoTimelineEventRepository implements ITimelineEventRepository {
  private readonly logger = new Logger(MongoTimelineEventRepository.name);

  constructor(
    @InjectModel(TimelineEventModel.name)
    private readonly model: Model<TimelineEventDocument>,
  ) {}

  async append(event: TimelineEvent): Promise<void> {
    try {
      await this.model.create(this.toPersistence(event));
    } catch (err: unknown) {
      // Ignora E11000 (duplicata por sourceEventId) — garante idempotência
      if (this.isDuplicateKeyError(err)) {
        this.logger.warn(
          `Evento duplicado ignorado [${event.eventType}] sourceEventId=${String(event.metadata['sourceEventId'])}`,
        );
        return;
      }
      throw err;
    }
  }

  async findByAggregateId(
    aggregateId: string,
    aggregateType?: AggregateType,
  ): Promise<TimelineEvent[]> {
    const filter: Record<string, unknown> = { aggregateId };
    if (aggregateType) {
      filter['aggregateType'] = aggregateType;
    }

    const docs = await this.model
      .find(filter)
      .sort({ timestamp: 1 })
      .lean<TimelineEventLean[]>()
      .exec();

    return docs.map((doc) => this.toDomain(doc));
  }

  async findAll(page: number, limit: number): Promise<{ items: TimelineEvent[]; total: number }> {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find()
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean<TimelineEventLean[]>()
        .exec(),
      this.model.countDocuments().exec(),
    ]);
    return { items: docs.map((doc) => this.toDomain(doc)), total };
  }

  private toDomain(doc: TimelineEventLean): TimelineEvent {
    return new TimelineEvent({
      id: doc._id,
      eventType: doc.eventType,
      aggregateId: doc.aggregateId,
      aggregateType: doc.aggregateType as AggregateType,
      payload: doc.payload,
      correlationId: doc.correlationId,
      timestamp: doc.timestamp,
      metadata: doc.metadata,
    });
  }

  private toPersistence(event: TimelineEvent): Record<string, unknown> {
    return {
      _id: event.id,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      payload: event.payload,
      correlationId: event.correlationId,
      timestamp: event.timestamp,
      metadata: event.metadata,
    };
  }

  private isDuplicateKeyError(err: unknown): boolean {
    return (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: number }).code === 11000
    );
  }
}
