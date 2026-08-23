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

import { TaskPriority } from "../enums/task-priority.enum.js";
import { TaskStatus } from "../enums/task-status.enum.js";

import { Comment } from "./comment.entity.js";
import { Project } from "./project.entity.js";
import { TaskAssignment } from "./task-assignment.entity.js";
import { User } from "./user.entity.js";

@Entity({ name: "tasks" })
@Index("idx_tasks_project_status_active", ["projectId", "status"], {
  where: '"deleted_at" IS NULL',
})
@Index("idx_tasks_project_priority_active", ["projectId", "priority"], {
  where: '"deleted_at" IS NULL',
})
@Index("idx_tasks_project_due_date_active", ["projectId", "dueDate"], {
  where: '"deleted_at" IS NULL',
})
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "project_id",
    type: "uuid",
  })
  projectId!: string;

  @Column({
    type: "varchar",
    length: 250,
  })
  title!: string;

  @Column({
    type: "text",
    nullable: true,
  })
  description!: string | null;

  @Column({
    type: "enum",
    enum: TaskStatus,
    enumName: "task_status",
    default: TaskStatus.TODO,
  })
  status!: TaskStatus;

  @Column({
    type: "enum",
    enum: TaskPriority,
    enumName: "task_priority",
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  @Column({
    name: "due_date",
    type: "timestamptz",
    nullable: true,
  })
  dueDate!: Date | null;

  @Column({
    name: "created_by_user_id",
    type: "uuid",
  })
  createdByUserId!: string;

  @ManyToOne(() => Project, (project) => project.tasks, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "project_id",
  })
  project!: Relation<Project>;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({
    name: "created_by_user_id",
  })
  createdBy!: Relation<User>;

  @OneToMany(() => TaskAssignment, (assignment) => assignment.task)
  assignments!: Relation<TaskAssignment[]>;

  @OneToMany(() => Comment, (comment) => comment.task)
  comments!: Relation<Comment[]>;

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
