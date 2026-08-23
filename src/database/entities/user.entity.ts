import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";

import { Comment } from "./comment.entity.js";
import { OrgMember } from "./org-member.entity.js";
import { TaskAssignment } from "./task-assignment.entity.js";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    type: "varchar",
    length: 120,
  })
  name!: string;

  @Column({
    type: "varchar",
    length: 255,
    unique: true,
  })
  email!: string;

  @Column({
    name: "password_hash",
    type: "varchar",
    length: 255,
  })
  passwordHash!: string;

  @Column({
    name: "is_active",
    type: "boolean",
    default: true,
  })
  isActive!: boolean;

  @OneToMany(() => OrgMember, (member) => member.user)
  memberships!: Relation<OrgMember[]>;

  @OneToMany(() => TaskAssignment, (assignment) => assignment.user)
  taskAssignments!: Relation<TaskAssignment[]>;

  @OneToMany(() => Comment, (comment) => comment.author)
  comments!: Relation<Comment[]>;

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
