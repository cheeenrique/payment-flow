import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UnauthorizedError } from '@/shared/errors/unauthorized.error';
import { Session } from '@/modules/auth/domain/entities/session.entity';
import { resolvePermissions } from '@/modules/auth/domain/rbac/role-permissions';
import type { IUserRepository } from '@/modules/auth/domain/repositories/user-repository.interface';
import type { ISessionRepository } from '@/modules/auth/domain/repositories/session-repository.interface';
import type { IPasswordHasher } from '@/modules/auth/domain/ports/password-hasher.interface';
import type { ITokenService, TokenPair } from '@/modules/auth/domain/ports/token-service.interface';
import { UserLoggedInEvent } from '@/modules/auth/domain/events/user-logged-in.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { USER_REPOSITORY, SESSION_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE } from '@/modules/auth/auth.tokens';

export interface LoginInput {
  email: string;
  password: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: ISessionRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    private readonly eventBus: EventBusService,
  ) {}

  async execute(input: LoginInput): Promise<TokenPair> {
    const normalizedEmail = input.email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValid = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Resolve roles → permissions e embute no JWT (permissões pré-resolvidas).
    const permissions = resolvePermissions(user.roles);
    const tokens = this.tokenService.generateTokenPair({
      userId: user.id,
      email: user.email,
      roles: user.roles,
      permissions,
    });
    const refreshTokenHash = await this.passwordHasher.hash(tokens.refreshToken);

    await this.sessionRepo.deleteByUserId(user.id);

    const expiresAt = new Date(Date.now() + this.tokenService.getRefreshExpiresInMs());
    const session = Session.create({ userId: user.id, refreshTokenHash, expiresAt });
    await this.sessionRepo.create(session);

    this.eventBus.publish(
      new UserLoggedInEvent(user.id, randomUUID(), user.email),
    );

    return tokens;
  }
}
