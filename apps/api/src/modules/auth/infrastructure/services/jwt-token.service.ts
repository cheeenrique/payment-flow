import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import type {
  ITokenService,
  TokenPair,
  JwtPayload,
  JwtUserClaims,
} from '@/modules/auth/domain/ports/token-service.interface';

const EXPIRY_MULTIPLIERS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

const DEFAULT_REFRESH_MS = 7 * 86_400_000; // 7 dias

@Injectable()
export class JwtTokenService implements ITokenService {
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;
  private readonly refreshExpiresInMs: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.refreshSecret = this.config.getOrThrow<string>('REFRESH_SECRET');
    this.refreshExpiresIn = this.config.getOrThrow<string>('REFRESH_EXPIRES_IN');
    this.refreshExpiresInMs = this.parseExpiry(this.refreshExpiresIn);
  }

  generateTokenPair(claims: JwtUserClaims): TokenPair {
    const payload = this.buildPayload(claims);
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn as StringValue,
    });
    return { accessToken, refreshToken };
  }

  generateAccessToken(claims: JwtUserClaims): string {
    return this.jwtService.sign(this.buildPayload(claims));
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.refreshSecret,
    });
  }

  getRefreshExpiresInMs(): number {
    return this.refreshExpiresInMs;
  }

  /** Monta o payload do JWT a partir dos claims do usuário. */
  private buildPayload(claims: JwtUserClaims): JwtPayload {
    return {
      sub: claims.userId,
      email: claims.email,
      roles: claims.roles,
      permissions: claims.permissions,
    };
  }

  private parseExpiry(value: string): number {
    const match = value.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return DEFAULT_REFRESH_MS;

    const amount = parseInt(match[1], 10);
    const multiplier = EXPIRY_MULTIPLIERS[match[2]] ?? DEFAULT_REFRESH_MS;
    return amount * multiplier;
  }
}
