import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ChargeStatus } from '@/modules/charges/domain/entities/charge.entity';
import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';

/**
 * Query params aceitos por GET /charges.
 * Estende PaginationQueryDto para herdar page/limit; adiciona filtros
 * específicos do módulo (status, customerId).
 */
export class ListChargesQueryDto extends PaginationQueryDto {
  /** Filtro por status do ciclo de vida da cobrança */
  @IsOptional()
  @IsEnum(ChargeStatus)
  status?: ChargeStatus;

  /** Filtro por ID do cliente */
  @IsOptional()
  @IsString()
  customerId?: string;
}
