/**
 * Resultado de listagem paginada — contrato de retorno padronizado dos use cases
 * de leitura que suportam paginação.
 *
 * Mantido no shared para que todos os módulos usem o mesmo tipo,
 * sem duplicação (DRY).
 */
export interface PaginatedResult<T> {
  /** Itens da página atual */
  items: T[];
  /** Total de registros na coleção (sem filtro de página) */
  total: number;
  /** Página atual (base 1) */
  page: number;
  /** Tamanho máximo da página */
  limit: number;
}
