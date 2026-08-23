import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";

import { Organization } from "./organization.entity.js";
import { Task } from "./task.entity.js";
import { User } from "./user.entity.js";

@Entity({ name: "projects" })
@Index("idx_projects_org_active_created", ["organizationId", "createdAt"], {
  where: '"deleted_at" IS NULL',
})
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "organization_id",
    type: "uuid",
  })
  organizationId!: string;

  @Column({
    type: "varchar",
    length: 200,
  })
  name!: string;

  @Column({
    type: "text",
    nullable: true,
  })
  description!: string | null;

  @Column({
    name: "created_by_user_id",
    type: "uuid",
  })
  createdByUserId!: string;

  @ManyToOne(() => Organization, (organization) => organization.projects, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({
    name: "organization_id",
  })
  organization!: Relation<Organization>;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({
    name: "created_by_user_id",
  })
  createdBy!: Relation<User>;

  @OneToMany(() => Task, (task) => task.project)
  tasks!: Relation<Task[]>;

  @DeleteDateColumn({
    name: "deleted_at",
    type: "timestamptz",
    nullable: true,
  })
  deletedAt!: Date | null;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamptz",
  })
  updatedAt!: Date;
}
