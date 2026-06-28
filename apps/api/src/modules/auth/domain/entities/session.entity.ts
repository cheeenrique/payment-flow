import { randomUUID } from 'crypto';

export interface SessionProps {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export class Session {
  readonly id: string;
  readonly userId: string;
  readonly refreshTokenHash: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;

  constructor(props: SessionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.refreshTokenHash = props.refreshTokenHash;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
  }

  static create(props: Omit<SessionProps, 'id' | 'createdAt'>): Session {
    return new Session({ ...props, id: randomUUID(), createdAt: new Date() });
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
