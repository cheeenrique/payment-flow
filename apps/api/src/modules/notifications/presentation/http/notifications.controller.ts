import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/presentation/http/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/modules/auth/presentation/http/guards/permissions.guard';
import { RequirePermissions } from '@/modules/auth/presentation/http/decorators/require-permissions.decorator';
import { Permissions } from '@/modules/auth/domain/rbac/permissions';
import { CurrentUser } from '@/modules/auth/presentation/http/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/modules/auth/presentation/http/strategies/jwt.strategy';
import { ListNotificationsUseCase } from '@/modules/notifications/application/use-cases/list-notifications.use-case';
import { GetNotificationUseCase } from '@/modules/notifications/application/use-cases/get-notification.use-case';
import { MarkAsReadUseCase } from '@/modules/notifications/application/use-cases/mark-as-read.use-case';
import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';

/**
 * Controller REST para o módulo de notificações.
 *
 * Segue CQRS pragmático: leitura via REST (e GraphQL).
 * Toda mutação de estado (marcar como lida) também aqui.
 * Handlers são thin: validam entrada, delegam ao use case, retornam.
 */
@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
    private readonly getNotificationUseCase: GetNotificationUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
  ) {}

  /** Lista notificações do usuário autenticado, paginadas, ordenadas por mais recentes */
  @Get()
  @RequirePermissions(Permissions.NotificationsRead)
  handleList(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.listNotificationsUseCase.execute({
      userId: user.userId,
      page: query.page,
      limit: query.limit,
    });
  }

  /** Busca notificação específica pelo id */
  @Get(':id')
  @RequirePermissions(Permissions.NotificationsRead)
  handleGetOne(@Param('id') id: string) {
    return this.getNotificationUseCase.execute(id);
  }

  /** Marca notificação como lida e emite evento SSE de atualização de status */
  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permissions.NotificationsUpdate)
  async handleMarkAsRead(@Param('id') id: string): Promise<void> {
    await this.markAsReadUseCase.execute(id);
  }
}
