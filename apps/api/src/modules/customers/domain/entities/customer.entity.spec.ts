import { Customer } from './customer.entity';

const baseProps = {
  name: 'Maria Souza',
  email: 'maria@example.com',
  document: '123.456.789-00',
  phone: '11999999999',
};

describe('Customer.create', () => {
  it('cria cliente com status active por padrão', () => {
    const customer = Customer.create(baseProps);

    expect(customer.status).toBe('active');
    expect(customer.isActive()).toBe(true);
  });

  it('gera id único (uuid) em cada criação', () => {
    const c1 = Customer.create(baseProps);
    const c2 = Customer.create(baseProps);

    expect(c1.id).toBeTruthy();
    expect(c1.id).not.toBe(c2.id);
  });

  it('define createdAt e updatedAt como Date', () => {
    const customer = Customer.create(baseProps);

    expect(customer.createdAt).toBeInstanceOf(Date);
    expect(customer.updatedAt).toBeInstanceOf(Date);
  });

  it('preserva name, email, document e phone fornecidos', () => {
    const customer = Customer.create(baseProps);

    expect(customer.name).toBe(baseProps.name);
    expect(customer.email).toBe(baseProps.email);
    expect(customer.document).toBe(baseProps.document);
    expect(customer.phone).toBe(baseProps.phone);
  });

  it('cria sem phone quando não informado', () => {
    const customer = Customer.create({ name: 'Ana', email: 'ana@test.com', document: '000' });

    expect(customer.phone).toBeUndefined();
  });
});

describe('Customer.withUpdate', () => {
  it('retorna nova instância com campos atualizados', () => {
    const original = Customer.create(baseProps);
    const updated = original.withUpdate({ name: 'Maria Santos', phone: '11888888888' });

    expect(updated.name).toBe('Maria Santos');
    expect(updated.phone).toBe('11888888888');
    // campos não atualizados permanecem iguais
    expect(updated.email).toBe(baseProps.email);
    expect(updated.document).toBe(baseProps.document);
  });

  it('retorna nova instância — não muta o original', () => {
    const original = Customer.create(baseProps);
    const updated = original.withUpdate({ name: 'Novo Nome' });

    expect(original.name).toBe(baseProps.name);
    expect(updated).not.toBe(original);
  });

  it('renova updatedAt na atualização', () => {
    const original = Customer.create(baseProps);
    // Garante diferença de tempo mínima
    const before = new Date();
    const updated = original.withUpdate({ name: 'Novo' });

    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('preserva id após atualização', () => {
    const original = Customer.create(baseProps);
    const updated = original.withUpdate({ name: 'Outro' });

    expect(updated.id).toBe(original.id);
  });
});

describe('Customer.deactivate', () => {
  it('retorna nova instância com status inactive', () => {
    const customer = Customer.create(baseProps);
    const deactivated = customer.deactivate();

    expect(deactivated.status).toBe('inactive');
    expect(deactivated.isActive()).toBe(false);
  });

  it('não muta o original', () => {
    const original = Customer.create(baseProps);
    const deactivated = original.deactivate();

    expect(original.status).toBe('active');
    expect(deactivated).not.toBe(original);
  });

  it('preserva id após desativação', () => {
    const original = Customer.create(baseProps);
    const deactivated = original.deactivate();

    expect(deactivated.id).toBe(original.id);
  });
});
