import { LoginUseCase, LoginInput } from './login.use-case';
import { UnauthorizedError } from '@/shared/errors/unauthorized.error';
import type { IUserRepository } from '@/modules/auth/domain/repositories/user-repository.interface';
import type { ISessionRepository } from '@/modules/auth/domain/repositories/session-repository.interface';
import type { IPasswordHasher } from '@/modules/auth/domain/ports/password-hasher.interface';
import type { ITokenService, TokenPair } from '@/modules/auth/domain/ports/token-service.interface';
import type { EventBusService } from '@/infra/messaging/event-bus.service';

const usuarioFake = {
  id: 'user-uuid',
  name: 'João Teste',
  email: 'joao@example.com',
  passwordHash: '$2b$10$hashed',
  roles: ['viewer'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const tokensFake: TokenPair = {
  accessToken: 'access.token.jwt',
  refreshToken: 'refresh.token.jwt',
};

function criarMocks(userExists = true, senhaValida = true) {
  const userRepo: jest.Mocked<IUserRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(userExists ? usuarioFake : null),
  };

  const sessionRepo: jest.Mocked<ISessionRepository> = {
    create: jest.fn().mockResolvedValue(undefined),
    findByUserId: jest.fn().mockResolvedValue(null),
    deleteByUserId: jest.fn().mockResolvedValue(undefined),
  };

  const passwordHasher: jest.Mocked<IPasswordHasher> = {
    hash: jest.fn().mockResolvedValue('$2b$10$newHash'),
    compare: jest.fn().mockResolvedValue(senhaValida),
  };

  const tokenService: jest.Mocked<ITokenService> = {
    generateTokenPair: jest.fn().mockReturnValue(tokensFake),
    generateAccessToken: jest.fn().mockReturnValue('access.token'),
    verifyRefreshToken: jest.fn(),
    getRefreshExpiresInMs: jest.fn().mockReturnValue(7 * 24 * 60 * 60 * 1000),
  };

  const eventBus = {
    publish: jest.fn(),
    republish: jest.fn(),
  } as unknown as jest.Mocked<EventBusService>;

  return { userRepo, sessionRepo, passwordHasher, tokenService, eventBus };
}

const inputValido: LoginInput = {
  email: 'joao@example.com',
  password: 'senha123',
};

describe('LoginUseCase', () => {
  describe('login bem-sucedido', () => {
    it('retorna accessToken e refreshToken para credenciais válidas', async () => {
      const { userRepo, sessionRepo, passwordHasher, tokenService, eventBus } = criarMocks();
      const useCase = new LoginUseCase(userRepo, sessionRepo, passwordHasher, tokenService, eventBus);

      const tokens = await useCase.execute(inputValido);

      expect(tokens.accessToken).toBe(tokensFake.accessToken);
      expect(tokens.refreshToken).toBe(tokensFake.refreshToken);
    });

    it('normaliza email para lowercase e trim antes de buscar', async () => {
      const { userRepo, sessionRepo, passwordHasher, tokenService, eventBus } = criarMocks();
      const useCase = new LoginUseCase(userRepo, sessionRepo, passwordHasher, tokenService, eventBus);

      await useCase.execute({ email: '  JOAO@EXAMPLE.COM  ', password: 'senha123' });

      expect(userRepo.findByEmail).toHaveBeenCalledWith('joao@example.com');
    });

    it('apaga sessão anterior antes de criar nova', async () => {
      const { userRepo, sessionRepo, passwordHasher, tokenService, eventBus } = criarMocks();
      const useCase = new LoginUseCase(userRepo, sessionRepo, passwordHasher, tokenService, eventBus);

      await useCase.execute(inputValido);

      expect(sessionRepo.deleteByUserId).toHaveBeenCalledWith(usuarioFake.id);
      expect(sessionRepo.create).toHaveBeenCalledTimes(1);
    });

    it('persiste hash do refreshToken na sessão (nunca o token em texto plano)', async () => {
      const { userRepo, sessionRepo, passwordHasher, tokenService, eventBus } = criarMocks();
      const useCase = new LoginUseCase(userRepo, sessionRepo, passwordHasher, tokenService, eventBus);

      await useCase.execute(inputValido);

      // O hash é gerado a partir do refreshToken
      expect(passwordHasher.hash).toHaveBeenCalledWith(tokensFake.refreshToken);
      // A sessão persistida deve ter o hash, não o token original
      expect(sessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ refreshTokenHash: '$2b$10$newHash' }),
      );
    });

    it('publica evento UserLoggedInEvent no eventBus', async () => {
      const { userRepo, sessionRepo, passwordHasher, tokenService, eventBus } = criarMocks();
      const useCase = new LoginUseCase(userRepo, sessionRepo, passwordHasher, tokenService, eventBus);

      await useCase.execute(inputValido);

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth.user.logged_in.v1' }),
      );
    });

    it('gera token com as permissões resolvidas a partir dos papéis do usuário', async () => {
      const { userRepo, sessionRepo, passwordHasher, tokenService, eventBus } = criarMocks();
      const useCase = new LoginUseCase(userRepo, sessionRepo, passwordHasher, tokenService, eventBus);

      await useCase.execute(inputValido);

      // viewer deve ter permissões não-wildcard
      expect(tokenService.generateTokenPair).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: usuarioFake.id,
          email: usuarioFake.email,
          roles: usuarioFake.roles,
          permissions: expect.any(Array),
        }),
      );
    });
  });

  describe('email não encontrado', () => {
    it('lança UnauthorizedError com mensagem genérica (não revela que o email não existe)', async () => {
      const { userRepo, sessionRepo, passwordHasher, tokenService, eventBus } = criarMocks(false);
      const useCase = new LoginUseCase(userRepo, sessionRepo, passwordHasher, tokenService, eventBus);

      await expect(useCase.execute(inputValido)).rejects.toThrow(UnauthorizedError);
    });

    it('não chama compare de senha quando usuário não existe', async () => {
      const { userRepo, sessionRepo, passwordHasher, tokenService, eventBus } = criarMocks(false);
      const useCase = new LoginUseCase(userRepo, sessionRepo, passwordHasher, tokenService, eventBus);

      await expect(useCase.execute(inputValido)).rejects.toThrow();

      expect(passwordHasher.compare).not.toHaveBeenCalled();
    });
  });

  describe('senha inválida', () => {
    it('lança UnauthorizedError com mensagem genérica (não revela que a senha está errada)', async () => {
      const { userRepo, sessionRepo, passwordHasher, tokenService, eventBus } = criarMocks(true, false);
      const useCase = new LoginUseCase(userRepo, sessionRepo, passwordHasher, tokenService, eventBus);

      await expect(useCase.execute(inputValido)).rejects.toThrow(UnauthorizedError);
    });

    it('não gera tokens nem cria sessão quando a senha é inválida', async () => {
      const { userRepo, sessionRepo, passwordHasher, tokenService, eventBus } = criarMocks(true, false);
      const useCase = new LoginUseCase(userRepo, sessionRepo, passwordHasher, tokenService, eventBus);

      await expect(useCase.execute(inputValido)).rejects.toThrow();

      expect(tokenService.generateTokenPair).not.toHaveBeenCalled();
      expect(sessionRepo.create).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('UnauthorizedError usa statusCode 401', async () => {
      const { userRepo, sessionRepo, passwordHasher, tokenService, eventBus } = criarMocks(true, false);
      const useCase = new LoginUseCase(userRepo, sessionRepo, passwordHasher, tokenService, eventBus);

      const err = await useCase.execute(inputValido).catch((e) => e);

      expect(err.statusCode).toBe(401);
    });
  });
});
