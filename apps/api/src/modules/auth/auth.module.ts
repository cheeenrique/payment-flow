import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';

import { UserModel, UserSchema } from './infrastructure/database/user.schema';
import { SessionModel, SessionSchema } from './infrastructure/database/session.schema';
import { MongoUserRepository } from './infrastructure/repositories/mongo-user.repository';
import { MongoSessionRepository } from './infrastructure/repositories/mongo-session.repository';
import { BcryptPasswordHasher } from './infrastructure/services/bcrypt-password-hasher';
import { JwtTokenService } from './infrastructure/services/jwt-token.service';

import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';

import { AuthController } from './presentation/http/auth.controller';
import { JwtStrategy } from './presentation/http/strategies/jwt.strategy';
import { JwtAuthGuard } from './presentation/http/guards/jwt-auth.guard';
import { PermissionsGuard } from './presentation/http/guards/permissions.guard';
import { GqlPermissionsGuard } from './presentation/graphql/gql-permissions.guard';

import { RabbitModule } from '@/infra/messaging/rabbit.module';
import {
  USER_REPOSITORY,
  SESSION_REPOSITORY,
  PASSWORD_HASHER,
  TOKEN_SERVICE,
} from './auth.tokens';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN') as StringValue,
        },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: SessionModel.name, schema: SessionSchema },
    ]),
    RabbitModule,
  ],
  controllers: [AuthController],
  providers: [
    // Repositories (DIP: symbol token → concrete implementation)
    { provide: USER_REPOSITORY, useClass: MongoUserRepository },
    { provide: SESSION_REPOSITORY, useClass: MongoSessionRepository },

    // Infrastructure services
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },

    // Application — use cases
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,

    // Presentation — passport + guards
    JwtStrategy,
    JwtAuthGuard,
    PermissionsGuard,
    GqlPermissionsGuard,
  ],
  exports: [
    // Other modules import AuthModule to get these
    JwtModule, // reexporta JwtService para guards externos (ex: SseJwtGuard)
    JwtAuthGuard,
    JwtStrategy,
    PassportModule,
    PermissionsGuard,
    GqlPermissionsGuard,
  ],
})
export class AuthModule {}
