import { DomainError } from './domain.error';
import { ConflictError } from './conflict.error';
import { NotFoundError } from './not-found.error';
import { UnauthorizedError } from './unauthorized.error';
import { ForbiddenError } from './forbidden.error';
import { ValidationError } from './validation.error';

describe('DomainError', () => {
  it('preserva todas as propriedades fornecidas no construtor', () => {
    const cause = new Error('causa raiz');
    const context = { id: 'abc' };
    const err = new DomainError('mensagem', 'ALGUM_CODIGO', 400, cause, context);

    expect(err.message).toBe('mensagem');
    expect(err.code).toBe('ALGUM_CODIGO');
    expect(err.statusCode).toBe(400);
    expect(err.cause).toBe(cause);
    expect(err.context).toEqual({ id: 'abc' });
  });

  it('é instância de Error', () => {
    const err = new DomainError('msg', 'CODIGO', 500);

    expect(err).toBeInstanceOf(Error);
  });

  it('define o name como o nome da subclasse', () => {
    class MeuErro extends DomainError {
      constructor() {
        super('msg', 'MEU_ERRO', 400);
      }
    }
    expect(new MeuErro().name).toBe('MeuErro');
  });
});

describe('ConflictError', () => {
  it('usa código CONFLICT e status 409', () => {
    const err = new ConflictError('conflito de recurso');

    expect(err.code).toBe('CONFLICT');
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe('conflito de recurso');
  });

  it('é instância de DomainError e Error', () => {
    const err = new ConflictError('x');

    expect(err).toBeInstanceOf(DomainError);
    expect(err).toBeInstanceOf(Error);
  });

  it('aceita cause e context opcionais', () => {
    const cause = new Error('raiz');
    const err = new ConflictError('msg', cause, { campo: 'email' });

    expect(err.cause).toBe(cause);
    expect(err.context).toEqual({ campo: 'email' });
  });
});

describe('NotFoundError', () => {
  it('usa código NOT_FOUND e status 404', () => {
    const err = new NotFoundError('recurso não encontrado');

    expect(err.code).toBe('NOT_FOUND');
    expect(err.statusCode).toBe(404);
  });

  it('é instância de DomainError', () => {
    expect(new NotFoundError('x')).toBeInstanceOf(DomainError);
  });
});

describe('UnauthorizedError', () => {
  it('usa código UNAUTHORIZED e status 401', () => {
    const err = new UnauthorizedError('não autenticado');

    expect(err.code).toBe('UNAUTHORIZED');
    expect(err.statusCode).toBe(401);
  });

  it('é instância de DomainError', () => {
    expect(new UnauthorizedError('x')).toBeInstanceOf(DomainError);
  });
});

describe('ForbiddenError', () => {
  it('usa código FORBIDDEN e status 403', () => {
    const err = new ForbiddenError('acesso negado');

    expect(err.code).toBe('FORBIDDEN');
    expect(err.statusCode).toBe(403);
  });

  it('aceita context com permissões exigidas', () => {
    const err = new ForbiddenError('acesso negado', undefined, { required: ['charges:create'] });

    expect(err.context).toEqual({ required: ['charges:create'] });
  });

  it('é instância de DomainError', () => {
    expect(new ForbiddenError('x')).toBeInstanceOf(DomainError);
  });
});

describe('ValidationError', () => {
  it('usa código VALIDATION_ERROR e status 422', () => {
    const err = new ValidationError('campo inválido');

    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(422);
  });

  it('é instância de DomainError', () => {
    expect(new ValidationError('x')).toBeInstanceOf(DomainError);
  });
});
