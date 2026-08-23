import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";

import { Organization } from "./organization.entity.js";
import { User } from "./user.entity.js";

@Entity({ name: "refresh_tokens" })
@Index("idx_refresh_tokens_user_org", ["userId", "organizationId"])
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "user_id",
    type: "uuid",
  })
  userId!: string;

  @Column({
    name: "organization_id",
    type: "uuid",
  })
  organizationId!: string;

  @Column({
    name: "token_hash",
    type: "varchar",
    length: 255,
    unique: true,
  })
  tokenHash!: string;

  @Column({
    name: "expires_at",
    type: "timestamptz",
  })
  expiresAt!: Date;

  @Column({
    name: "revoked_at",
    type: "timestamptz",
    nullable: true,
  })
  revokedAt!: Date | null;

  @Column({
    name: "replaced_by_token_id",
    type: "uuid",
    nullable: true,
  })
  replacedByTokenId!: string | null;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "user_id",
  })
  user!: Relation<User>;

  @ManyToOne(() => Organization, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "organization_id",
  })
  organization!: Relation<Organization>;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;
}
