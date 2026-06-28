import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session } from '@/modules/auth/domain/entities/session.entity';
import type { ISessionRepository } from '@/modules/auth/domain/repositories/session-repository.interface';
import { SessionModel, SessionDocument } from '@/modules/auth/infrastructure/database/session.schema';

interface SessionLean {
  _id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class MongoSessionRepository implements ISessionRepository {
  constructor(
    @InjectModel(SessionModel.name)
    private readonly model: Model<SessionDocument>,
  ) {}

  async create(session: Session): Promise<void> {
    await this.model.create({
      _id: session.id,
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      expiresAt: session.expiresAt,
    });
  }

  async findByUserId(userId: string): Promise<Session | null> {
    const doc = await this.model
      .findOne({ userId })
      .lean<SessionLean>()
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.model.deleteMany({ userId }).exec();
  }

  private toDomain(doc: SessionLean): Session {
    return new Session({
      id: doc._id,
      userId: doc.userId,
      refreshTokenHash: doc.refreshTokenHash,
      expiresAt: doc.expiresAt,
      createdAt: doc.createdAt,
    });
  }
}
