import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';

/**
 * Query params de paginação para GET /customers.
 * Estende PaginationQueryDto para herdar page/limit com validação e coerção.
 */
export class ListCustomersDto extends PaginationQueryDto {}
