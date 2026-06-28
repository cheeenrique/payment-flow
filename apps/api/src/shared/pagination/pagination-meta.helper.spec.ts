import { buildPaginationMeta } from './pagination-meta.helper';
import type { PaginatedResult } from './paginated-result.interface';

describe('buildPaginationMeta', () => {
  it('calcula hasNext=true quando há mais itens além da página atual', () => {
    const result: PaginatedResult<string> = { items: [], total: 30, page: 1, limit: 10 };

    const meta = buildPaginationMeta(result);

    // page 1, limit 10: 1 * 10 = 10 < 30 → hasNext
    expect(meta.hasNext).toBe(true);
  });

  it('calcula hasNext=false na última página exata', () => {
    const result: PaginatedResult<string> = { items: [], total: 20, page: 2, limit: 10 };

    const meta = buildPaginationMeta(result);

    // page 2, limit 10: 2 * 10 = 20 == 20 → sem próxima
    expect(meta.hasNext).toBe(false);
  });

  it('calcula hasPrev=false na primeira página', () => {
    const result: PaginatedResult<string> = { items: [], total: 100, page: 1, limit: 10 };

    const meta = buildPaginationMeta(result);

    expect(meta.hasPrev).toBe(false);
  });

  it('calcula hasPrev=true a partir da segunda página', () => {
    const result: PaginatedResult<string> = { items: [], total: 100, page: 2, limit: 10 };

    const meta = buildPaginationMeta(result);

    expect(meta.hasPrev).toBe(true);
  });

  it('retorna hasNext=false e hasPrev=false quando total cabe em uma página', () => {
    const result: PaginatedResult<number> = { items: [1, 2, 3], total: 3, page: 1, limit: 10 };

    const meta = buildPaginationMeta(result);

    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
  });

  it('preserva total, page e limit no resultado', () => {
    const result: PaginatedResult<string> = { items: [], total: 55, page: 3, limit: 15 };

    const meta = buildPaginationMeta(result);

    expect(meta.total).toBe(55);
    expect(meta.page).toBe(3);
    expect(meta.limit).toBe(15);
  });

  it('retorna hasNext=true quando está numa página intermediária', () => {
    // page 2, limit 10, total 25: 2 * 10 = 20 < 25 → hasNext
    const result: PaginatedResult<string> = { items: [], total: 25, page: 2, limit: 10 };

    const meta = buildPaginationMeta(result);

    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(true);
  });

  it('lida com total=0 (coleção vazia)', () => {
    const result: PaginatedResult<never> = { items: [], total: 0, page: 1, limit: 10 };

    const meta = buildPaginationMeta(result);

    // 1 * 10 = 10 > 0 → hasNext = false
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
    expect(meta.total).toBe(0);
  });
});
