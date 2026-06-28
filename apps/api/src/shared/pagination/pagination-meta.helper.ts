import type { PaginatedResult } from './paginated-result.interface';

/** Metadados de paginação retornados em meta.pagination nas respostas REST */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Calcula os metadados derivados de paginação a partir de um PaginatedResult.
 * hasNext e hasPrev são derivados — não devem ser calculados em múltiplos lugares.
 */
export function buildPaginationMeta<T>(result: PaginatedResult<T>): PaginationMeta {
  const { total, page, limit } = result;
  return {
    total,
    page,
    limit,
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}
