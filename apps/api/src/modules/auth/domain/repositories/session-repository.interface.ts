import type { Session } from '@/modules/auth/domain/entities/session.entity';

export interface ISessionRepository {
  create(session: Session): Promise<void>;
  findByUserId(userId: string): Promise<Session | null>;
  deleteByUserId(userId: string): Promise<void>;
}
