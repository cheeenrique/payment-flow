import { User } from './user.entity';
import { DEFAULT_ROLE, Roles } from '@/modules/auth/domain/rbac/roles';

describe('User.create', () => {
  const baseProps = {
    name: 'João Silva',
    email: 'joao@example.com',
    passwordHash: '$2b$10$hashedpassword',
  };

  it('cria usuário com papel padrão viewer quando nenhum papel é informado', () => {
    const user = User.create(baseProps);

    expect(user.roles).toEqual([DEFAULT_ROLE]);
    expect(user.roles).toContain(Roles.Viewer);
  });

  it('cria usuário com papel padrão viewer quando array de papéis vazio é passado', () => {
    const user = User.create({ ...baseProps, roles: [] });

    expect(user.roles).toEqual([DEFAULT_ROLE]);
  });

  it('respeita os papéis fornecidos quando não-vazios', () => {
    const user = User.create({ ...baseProps, roles: [Roles.Admin] });

    expect(user.roles).toEqual([Roles.Admin]);
  });

  it('gera um id único (uuid) em cada criação', () => {
    const user1 = User.create(baseProps);
    const user2 = User.create(baseProps);

    expect(user1.id).toBeTruthy();
    expect(user2.id).toBeTruthy();
    expect(user1.id).not.toBe(user2.id);
  });

  it('define createdAt e updatedAt como Date', () => {
    const user = User.create(baseProps);

    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
  });

  it('preserva name, email e passwordHash fornecidos', () => {
    const user = User.create(baseProps);

    expect(user.name).toBe(baseProps.name);
    expect(user.email).toBe(baseProps.email);
    expect(user.passwordHash).toBe(baseProps.passwordHash);
  });

  it('nunca expõe a senha em texto plano (apenas hash)', () => {
    const user = User.create({ ...baseProps, passwordHash: '$2b$10$somehash' });

    // O objeto não deve ter propriedade "password" (plain text)
    expect((user as unknown as Record<string, unknown>)['password']).toBeUndefined();
    expect(user.passwordHash).toBeTruthy();
  });
});
