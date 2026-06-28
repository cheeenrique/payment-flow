import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConflictError } from '@/shared/errors/conflict.error';
import { User } from '@/modules/auth/domain/entities/user.entity';
import type { IUserRepository } from '@/modules/auth/domain/repositories/user-repository.interface';
import type { IPasswordHasher } from '@/modules/auth/domain/ports/password-hasher.interface';
import { UserRegisteredEvent } from '@/modules/auth/domain/events/user-registered.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { USER_REPOSITORY, PASSWORD_HASHER } from '@/modules/auth/auth.tokens';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface RegisterOutput {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    private readonly eventBus: EventBusService,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const existing = await this.userRepo.findByEmail(normalizedEmail);

    if (existing) {
      throw new ConflictError('Email already in use');
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    // Sem roles informadas → User.create aplica o papel padrão (viewer).
    const user = User.create({ name: input.name, email: normalizedEmail, passwordHash });

    await this.userRepo.create(user);

    this.eventBus.publish(
      new UserRegisteredEvent(user.id, randomUUID(), user.name, user.email),
    );

    return { id: user.id, name: user.name, email: user.email, roles: user.roles };
  }
}
