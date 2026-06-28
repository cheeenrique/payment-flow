import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UnauthorizedError } from '@/shared/errors/unauthorized.error';
import type { ISessionRepository } from '@/modules/auth/domain/repositories/session-repository.interface';
import type { IPasswordHasher } from '@/modules/auth/domain/ports/password-hasher.interface';
import type { ITokenService, JwtPayload } from '@/modules/auth/domain/ports/token-service.interface';
import { TokenRefreshedEvent } from '@/modules/auth/domain/events/token-refreshed.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SESSION_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE } from '@/modules/auth/auth.tokens';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: ISessionRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: IPasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: ITokenService,
    private readonly eventBus: EventBusService,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    let payload: JwtPayload;

    try {
      payload = this.tokenService.verifyRefreshToken(input.refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const session = await this.sessionRepo.findByUserId(payload.sub);
    if (!session) {
      throw new UnauthorizedError('Session not found');
    }

    if (session.isExpired()) {
      await this.sessionRepo.deleteByUserId(payload.sub);
      throw new UnauthorizedError('Session expired');
    }

    const isValid = await this.passwordHasher.compare(
      input.refreshToken,
      session.refreshTokenHash,
    );
    if (!isValid) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Reemite o access token preservando roles/permissions do refresh.
    const accessToken = this.tokenService.generateAccessToken({
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
    });

    this.eventBus.publish(
      new TokenRefreshedEvent(payload.sub, randomUUID(), payload.email),
    );

    return { accessToken };
  }
}
