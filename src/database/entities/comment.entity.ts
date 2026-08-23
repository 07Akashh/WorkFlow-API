import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from "typeorm";

import { Task } from "./task.entity.js";
import { User } from "./user.entity.js";

@Entity({ name: "comments" })
@Index("idx_comments_task_created", ["taskId", "createdAt"])
export class Comment {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "task_id",
    type: "uuid",
  })
  taskId!: string;

  @Column({
    name: "author_user_id",
    type: "uuid",
  })
  authorUserId!: string;

  @Column({
    type: "text",
  })
  body!: string;

  @ManyToOne(() => Task, (task) => task.comments, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "task_id",
  })
  task!: Relation<Task>;

  @ManyToOne(() => User, (user) => user.comments, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({
    name: "author_user_id",
  })
  author!: Relation<User>;

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
