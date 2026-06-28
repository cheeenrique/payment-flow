import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

/**
 * Tipo GraphQL para o objeto Notification.
 *
 * Usado pelo resolver code-first para gerar o schema SDL automaticamente.
 * Espelha os campos da entidade de domínio; não tem lógica de negócio.
 */
@ObjectType({ description: 'Notificação gerada pelo sistema' })
export class NotificationObjectType {
  @Field(() => ID, { description: 'Identificador único da notificação' })
  id!: string;

  @Field({ description: 'Severidade: info | success | warning | error' })
  type!: string;

  @Field({ description: 'Tipo do evento de origem (ex: payment.approved.v1)' })
  eventType!: string;

  @Field({ description: 'Título resumido da notificação' })
  title!: string;

  @Field({ description: 'Mensagem descritiva da notificação' })
  message!: string;

  @Field({ nullable: true, description: 'Usuário destinatário (opcional)' })
  userId?: string;

  @Field({ nullable: true, description: 'Cliente relacionado ao evento' })
  customerId?: string;

  @Field({ description: 'Indica se o usuário já leu a notificação' })
  read!: boolean;

  @Field({ description: 'Data e hora de criação da notificação' })
  createdAt!: Date;
}

/** Tipo de resposta paginada para a query de listagem de notificações */
@ObjectType('NotificationsPage')
export class NotificationsPageType {
  @Field(() => [NotificationObjectType])
  items!: NotificationObjectType[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field()
  hasNext!: boolean;

  @Field()
  hasPrev!: boolean;
}
