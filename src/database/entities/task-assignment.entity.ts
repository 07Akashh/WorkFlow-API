import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  Index,
  type Relation,
} from "typeorm";

import { Task } from "./task.entity.js";
import { User } from "./user.entity.js";

@Entity({ name: "task_assignments" })
@Unique("uq_task_assignments_task_user", ["taskId", "userId"])
@Index("idx_task_assignments_user_task", ["userId", "taskId"])
export class TaskAssignment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "task_id",
    type: "uuid",
  })
  taskId!: string;

  @Column({
    name: "user_id",
    type: "uuid",
  })
  userId!: string;

  @Column({
    name: "assigned_by_user_id",
    type: "uuid",
  })
  assignedByUserId!: string;

  @ManyToOne(() => Task, (task) => task.assignments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "task_id",
  })
  task!: Relation<Task>;

  @ManyToOne(() => User, (user) => user.taskAssignments, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({
    name: "user_id",
  })
  user!: Relation<User>;

  @ManyToOne(() => User, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({
    name: "assigned_by_user_id",
  })
  assignedBy!: Relation<User>;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamptz",
  })
  createdAt!: Date;
}
