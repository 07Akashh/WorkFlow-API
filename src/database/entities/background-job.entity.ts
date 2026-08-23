import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { JobStatus } from "../enums/job-status.enum.js";

@Entity({ name: "background_jobs" })
export class BackgroundJob {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({
    name: "bull_job_id",
    type: "varchar",
    length: 255,
    nullable: true,
    unique: true,
  })
  bullJobId!: string | null;

  @Column({
    type: "varchar",
    length: 100,
  })
  type!: string;

  @Column({
    type: "enum",
    enum: JobStatus,
    enumName: "background_job_status",
    default: JobStatus.PENDING,
  })
  status!: JobStatus;

  @Column({
    type: "jsonb",
    default: {},
  })
  metadata!: Record<string, unknown>;

  @Column({
    type: "integer",
    default: 0,
  })
  attempts!: number;

  @Column({
    name: "error_message",
    type: "text",
    nullable: true,
  })
  errorMessage!: string | null;

  @Column({
    name: "started_at",
    type: "timestamptz",
    nullable: true,
  })
  startedAt!: Date | null;

  @Column({
    name: "completed_at",
    type: "timestamptz",
    nullable: true,
  })
  completedAt!: Date | null;

  @Column({
    name: "failed_at",
    type: "timestamptz",
    nullable: true,
  })
  failedAt!: Date | null;

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
