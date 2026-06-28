import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ListNotificationsUseCase } from '@/modules/notifications/application/use-cases/list-notifications.use-case';
import { NotificationObjectType, NotificationsPageType } from './models/notification.model';
import { GqlAuthGuard } from '@/modules/auth/presentation/graphql/gql-auth.guard';
import { buildPaginationMeta } from '@/shared/pagination/pagination-meta.helper';
import type { Notification } from '@/modules/notifications/domain/entities/notification.entity';

/**
 * Resolver GraphQL code-first para consultas de notificações.
 *
 * Requer GraphQLModule configurado no AppModule (Apollo).
 * Feed global (eventos de sistema); filtro opcional por customerId.
 */
@Resolver(() => NotificationObjectType)
export class NotificationsResolver {
  constructor(
    private readonly listNotificationsUseCase: ListNotificationsUseCase,
  ) {}

  @Query(() => NotificationsPageType, {
    name: 'notifications',
    description: 'Feed paginado de notificações do sistema (filtro opcional por customerId)',
  })
  @UseGuards(GqlAuthGuard)
  async getNotifications(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 }) limit: number,
    @Args('customerId', { nullable: true }) customerId?: string,
  ): Promise<NotificationsPageType> {
    const result = await this.listNotificationsUseCase.execute({
      customerId,
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
