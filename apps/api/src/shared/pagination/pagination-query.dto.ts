import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Query params de paginação reutilizados por todas as rotas de listagem REST.
 * Controllers de listagem recebem @Query() dto: PaginationQueryDto (ou uma
 * subclasse que adiciona filtros específicos do módulo).
 *
 * @Type(() => Number) é necessário para coerção de query string (chegam como texto).
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
