import { RegisterUseCase, RegisterInput } from './register.use-case';
import { ConflictError } from '@/shared/errors/conflict.error';
import type { IUserRepository } from '@/modules/auth/domain/repositories/user-repository.interface';
import type { IPasswordHasher } from '@/modules/auth/domain/ports/password-hasher.interface';
import type { EventBusService } from '@/infra/messaging/event-bus.service';
import { Roles } from '@/modules/auth/domain/rbac/roles';

/** Fábrica de mocks para os colaboradores do use case */
function criarMocks() {
  const userRepo: jest.Mocked<IUserRepository> = {
    create: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn().mockResolvedValue(null),
    findByEmail: jest.fn().mockResolvedValue(null),
  };

  const passwordHasher: jest.Mocked<IPasswordHasher> = {
    hash: jest.fn().mockResolvedValue('$2b$10$hashed'),
    compare: jest.fn().mockResolvedValue(true),
  };

  const eventBus = {
    publish: jest.fn(),
    republish: jest.fn(),
  } as unknown as jest.Mocked<EventBusService>;

  return { userRepo, passwordHasher, eventBus };
}

const inputValido: RegisterInput = {
  name: 'Carlos Teste',
  email: 'carlos@example.com',
  password: 'senha-segura-123',
};

describe('RegisterUseCase', () => {
  describe('registro bem-sucedido', () => {
    it('retorna id, name, email e roles do usuário criado', async () => {
      const { userRepo, passwordHasher, eventBus } = criarMocks();
      const useCase = new RegisterUseCase(userRepo, passwordHasher, eventBus);

      const output = await useCase.execute(inputValido);

      expect(output.id).toBeTruthy();
      expect(output.name).toBe(inputValido.name);
      expect(output.email).toBe('carlos@example.com');
      expect(output.roles).toContain(Roles.Viewer);
    });

    it('nunca inclui senha no retorno', async () => {
      const { userRepo, passwordHasher, eventBus } = criarMocks();
      const useCase = new RegisterUseCase(userRepo, passwordHasher, eventBus);

      const output = await useCase.execute(inputValido);

      expect((output as unknown as Record<string, unknown>)['password']).toBeUndefined();
      expect((output as unknown as Record<string, unknown>)['passwordHash']).toBeUndefined();
    });

    it('normaliza email para lowercase e trim antes de salvar', async () => {
      const { userRepo, passwordHasher, eventBus } = criarMocks();
      const useCase = new RegisterUseCase(userRepo, passwordHasher, eventBus);

      await useCase.execute({ ...inputValido, email: '  CARLOS@EXAMPLE.COM  ' });

      // Verifica que o repositório foi consultado e chamado com o email normalizado
      expect(userRepo.findByEmail).toHaveBeenCalledWith('carlos@example.com');
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'carlos@example.com' }),
      );
    });

    it('faz hash da senha antes de persistir', async () => {
      const { userRepo, passwordHasher, eventBus } = criarMocks();
      const useCase = new RegisterUseCase(userRepo, passwordHasher, eventBus);

      await useCase.execute(inputValido);

      expect(passwordHasher.hash).toHaveBeenCalledWith(inputValido.password);
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ passwordHash: '$2b$10$hashed' }),
      );
    });

    it('persiste o usuário no repositório uma única vez', async () => {
      const { userRepo, passwordHasher, eventBus } = criarMocks();
      const useCase = new RegisterUseCase(userRepo, passwordHasher, eventBus);

      await useCase.execute(inputValido);

      expect(userRepo.create).toHaveBeenCalledTimes(1);
    });

    it('publica evento UserRegisteredEvent no eventBus', async () => {
      const { userRepo, passwordHasher, eventBus } = criarMocks();
      const useCase = new RegisterUseCase(userRepo, passwordHasher, eventBus);

      await useCase.execute(inputValido);

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth.user.registered.v1' }),
      );
    });

    it('atribui papel viewer por padrão (sem papéis informados)', async () => {
      const { userRepo, passwordHasher, eventBus } = criarMocks();
      const useCase = new RegisterUseCase(userRepo, passwordHasher, eventBus);

      const output = await useCase.execute(inputValido);

      expect(output.roles).toEqual([Roles.Viewer]);
    });
  });

  describe('email duplicado', () => {
    it('lança ConflictError quando o email já está em uso', async () => {
      const { userRepo, passwordHasher, eventBus } = criarMocks();
      // Simula usuário existente
      userRepo.findByEmail.mockResolvedValue({
        id: 'existing-id',
        name: 'Existente',
        email: 'carlos@example.com',
        passwordHash: '$2b$10$hash',
        roles: ['viewer'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);
      const useCase = new RegisterUseCase(userRepo, passwordHasher, eventBus);

      await expect(useCase.execute(inputValido)).rejects.toThrow(ConflictError);
    });

    it('não persiste nem faz hash quando email está duplicado', async () => {
      const { userRepo, passwordHasher, eventBus } = criarMocks();
      userRepo.findByEmail.mockResolvedValue({ id: 'existing' } as never);
      const useCase = new RegisterUseCase(userRepo, passwordHasher, eventBus);

      await expect(useCase.execute(inputValido)).rejects.toThrow(ConflictError);

      expect(passwordHasher.hash).not.toHaveBeenCalled();
      expect(userRepo.create).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('ConflictError usa código CONFLICT e statusCode 409', async () => {
      const { userRepo, passwordHasher, eventBus } = criarMocks();
      userRepo.findByEmail.mockResolvedValue({ id: 'existing' } as never);
      const useCase = new RegisterUseCase(userRepo, passwordHasher, eventBus);

      const err = await useCase.execute(inputValido).catch((e) => e);

      expect(err.code).toBe('CONFLICT');
      expect(err.statusCode).toBe(409);
    });
  });
});
