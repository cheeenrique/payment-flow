import { randomUUID } from 'crypto';
import { DEFAULT_ROLE } from '@/modules/auth/domain/rbac/roles';

export interface UserProps {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly roles: string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.roles = props.roles;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    props: Omit<UserProps, 'id' | 'roles' | 'createdAt' | 'updatedAt'> & {
      roles?: string[];
    },
  ): User {
    const now = new Date();
    // Sem papéis informados → assume o papel padrão (viewer).
    const roles =
      props.roles && props.roles.length > 0 ? props.roles : [DEFAULT_ROLE];
    return new User({
      id: randomUUID(),
      name: props.name,
      email: props.email,
      passwordHash: props.passwordHash,
      roles,
      createdAt: now,
      updatedAt: now,
    });
  }
}
