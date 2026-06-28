import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ListNotificationsUseCase } from '@/modules/notifications/application/use-cases/list-notifications.use-case';
import { NotificationObjectType, NotificationsPageType } from './models/notification.model';
import { GqlAuthGuard } from '@/modules/auth/presentation/graphql/gql-auth.guard';
import { GqlCurrentUser } from '@/modules/auth/presentation/graphql/gql-current-user.decorator';
import { buildPaginationMeta } from '@/shared/pagination/pagination-meta.helper';
import type { AuthenticatedUser } from '@/modules/auth/presentation/http/strategies/jwt.strategy';
import type { Notification } from '@/modules/notifications/domain/entities/notification.entity';

/**
 * Resolver GraphQL code-first para consultas de notificações.
 *
 * Requer GraphQLModule configurado no AppModule (Apollo).
 * Usa GqlAuthGuard para extrair o usuário do contexto GraphQL.
 */
@Resolver(() => NotificationObjectType)
export class NotificationsResolver {
  constructor(
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
  ) {}

  @Query(() => NotificationsPageType, {
    name: 'notifications',
    description: 'Lista paginada de notificações do usuário autenticado',
  })
  @UseGuards(GqlAuthGuard)
  async getNotifications(
    @GqlCurrentUser() user: AuthenticatedUser,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
  ): Promise<NotificationsPageType> {
    const result = await this.listNotificationsUseCase.execute({
      userId: user.userId,
      page,
      limit,
    });
    const { hasNext, hasPrev } = buildPaginationMeta(result);
    return {
      items: result.items.map((n) => this.toObjectType(n)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNext,
      hasPrev,
    };
  }

  /** Converte entidade de domínio em tipo GraphQL sem acoplamento entre camadas */
  private toObjectType(n: Notification): NotificationObjectType {
    return {
      id: n.id,
      type: n.type,
      eventType: n.eventType,
      title: n.title,
      message: n.message,
      userId: n.userId,
      customerId: n.customerId,
      read: n.read,
      createdAt: n.createdAt,
    };
  }
}
