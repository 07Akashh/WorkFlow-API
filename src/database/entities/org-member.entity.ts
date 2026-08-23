import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  type Relation,
} from "typeorm";

import { OrgRole } from "../enums/org-role.enum.js";

import { Organization } from "./organization.entity.js";
import { User } from "./user.entity.js";

@Entity({ name: "org_members" })
@Unique("uq_org_members_organization_user", ["organizationId", "userId"])
@Index("idx_org_members_user", ["userId"])
export class OrgMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "organization_id",
    type: "uuid",
  })
  organizationId!: string;

  @Column({
    name: "user_id",
    type: "uuid",
  })
  userId!: string;

  @Column({
    type: "enum",
    enum: OrgRole,
    enumName: "org_role",
    default: OrgRole.MEMBER,
  })
  role!: OrgRole;

  @ManyToOne(() => Organization, (organization) => organization.members, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "organization_id",
  })
  organization!: Relation<Organization>;

  @ManyToOne(() => User, (user) => user.memberships, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({
    name: "user_id",
  })
  user!: Relation<User>;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;
}
