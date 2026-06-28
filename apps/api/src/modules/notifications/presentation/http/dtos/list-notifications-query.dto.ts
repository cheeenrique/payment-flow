import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';

/**
 * Query params da listagem de notificações: paginação + filtro opcional
 * por cliente. Estende PaginationQueryDto para o feed do dashboard.
 */
export class ListNotificationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  customerId?: string;
}
