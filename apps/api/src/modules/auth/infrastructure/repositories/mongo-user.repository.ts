import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '@/modules/auth/domain/entities/user.entity';
import type { IUserRepository } from '@/modules/auth/domain/repositories/user-repository.interface';
import { UserModel, UserDocument } from '@/modules/auth/infrastructure/database/user.schema';

interface UserLean {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MongoUserRepository implements IUserRepository {
  constructor(
    @InjectModel(UserModel.name)
    private readonly model: Model<UserDocument>,
  ) {}

  async create(user: User): Promise<void> {
    await this.model.create({
      _id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      roles: user.roles,
    });
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.model.findById(id).lean<UserLean>().exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model
      .findOne({ email: email.toLowerCase() })
      .lean<UserLean>()
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  private toDomain(doc: UserLean): User {
    return new User({
      id: doc._id,
      name: doc.name,
      email: doc.email,
      passwordHash: doc.passwordHash,
      roles: doc.roles ?? [],
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
