import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1787383736371 implements MigrationInterface {
  name = "InitialSchema1787383736371";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."background_job_status" AS ENUM('pending', 'active', 'completed', 'failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "background_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "bull_job_id" character varying(255), "type" character varying(100) NOT NULL, "status" "public"."background_job_status" NOT NULL DEFAULT 'pending', "metadata" jsonb NOT NULL DEFAULT '{}', "attempts" integer NOT NULL DEFAULT '0', "error_message" text, "started_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "failed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f70bf3fae2dc94160888351afa9" UNIQUE ("bull_job_id"), CONSTRAINT "PK_c1f31731b1a02806c4aa631acb8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "task_assignments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid NOT NULL, "user_id" uuid NOT NULL, "assigned_by_user_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_task_assignments_task_user" UNIQUE ("task_id", "user_id"), CONSTRAINT "PK_b68f42cf36d807d8a19a96066d7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_task_assignments_user_task" ON "task_assignments"  ("user_id", "task_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(120) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE TYPE "public"."org_role" AS ENUM('org_admin', 'member')`);
    await queryRunner.query(
      `CREATE TABLE "org_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."org_role" NOT NULL DEFAULT 'member', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "uq_org_members_organization_user" UNIQUE ("organization_id", "user_id"), CONSTRAINT "PK_8391a72b91725161ab2cab00be9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_org_members_user" ON "org_members"  ("user_id") `);
    await queryRunner.query(
      `CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(150) NOT NULL, "slug" character varying(150) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_963693341bd612aa01ddf3a4b68" UNIQUE ("slug"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "projects" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "name" character varying(200) NOT NULL, "description" text, "created_by_user_id" uuid NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6271df0a7aed1d6c0691ce6ac50" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_projects_org_active_created" ON "projects"  ("organization_id", "created_at") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'review', 'done')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high', 'urgent')`,
    );
    await queryRunner.query(
      `CREATE TABLE "tasks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "project_id" uuid NOT NULL, "title" character varying(250) NOT NULL, "description" text, "status" "public"."task_status" NOT NULL DEFAULT 'todo', "priority" "public"."task_priority" NOT NULL DEFAULT 'medium', "due_date" TIMESTAMP WITH TIME ZONE, "created_by_user_id" uuid NOT NULL, "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_project_due_date_active" ON "tasks"  ("project_id", "due_date") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_project_priority_active" ON "tasks"  ("project_id", "priority") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tasks_project_status_active" ON "tasks"  ("project_id", "status") WHERE "deleted_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE TABLE "comments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "task_id" uuid NOT NULL, "author_user_id" uuid NOT NULL, "body" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8bf68bc960f2b69e818bdb90dcb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_comments_task_created" ON "comments"  ("task_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "replaced_by_token_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_a7838d2ba25be1342091b6695f1" UNIQUE ("token_hash"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_refresh_tokens_user_org" ON "refresh_tokens"  ("user_id", "organization_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "task_assignments" ADD CONSTRAINT "FK_b389f4488d0a8241c3c98273966" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_assignments" ADD CONSTRAINT "FK_1673eab025dbc14e188bd4df67c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_assignments" ADD CONSTRAINT "FK_5187c441a70fe34f1b99c1d062d" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_members" ADD CONSTRAINT "FK_57cc80519a23c4a6d671723a83d" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_members" ADD CONSTRAINT "FK_220d854a7932f6aac9ed84f71c9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_585c8ce06628c70b70100bfb842" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" ADD CONSTRAINT "FK_9b4b555ca01bd035b4879ed4fce" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tasks" ADD CONSTRAINT "FK_932b7ae90148e482bc27b0a6d65" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_18c2493067c11f44efb35ca0e03" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" ADD CONSTRAINT "FK_ca96de050d1b690cefccebc7dc8" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_78a23ff687c363e19d1e69b1dbd" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_78a23ff687c363e19d1e69b1dbd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_ca96de050d1b690cefccebc7dc8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "comments" DROP CONSTRAINT "FK_18c2493067c11f44efb35ca0e03"`,
    );
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_932b7ae90148e482bc27b0a6d65"`);
    await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_9eecdb5b1ed8c7c2a1b392c28d4"`);
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_9b4b555ca01bd035b4879ed4fce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "projects" DROP CONSTRAINT "FK_585c8ce06628c70b70100bfb842"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_members" DROP CONSTRAINT "FK_220d854a7932f6aac9ed84f71c9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "org_members" DROP CONSTRAINT "FK_57cc80519a23c4a6d671723a83d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_assignments" DROP CONSTRAINT "FK_5187c441a70fe34f1b99c1d062d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_assignments" DROP CONSTRAINT "FK_1673eab025dbc14e188bd4df67c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "task_assignments" DROP CONSTRAINT "FK_b389f4488d0a8241c3c98273966"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_refresh_tokens_user_org"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP INDEX "public"."idx_comments_task_created"`);
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tasks_project_status_active"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tasks_project_priority_active"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tasks_project_due_date_active"`);
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TYPE "public"."task_priority"`);
    await queryRunner.query(`DROP TYPE "public"."task_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_projects_org_active_created"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
    await queryRunner.query(`DROP INDEX "public"."idx_org_members_user"`);
    await queryRunner.query(`DROP TABLE "org_members"`);
    await queryRunner.query(`DROP TYPE "public"."org_role"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP INDEX "public"."idx_task_assignments_user_task"`);
    await queryRunner.query(`DROP TABLE "task_assignments"`);
    await queryRunner.query(`DROP TABLE "background_jobs"`);
    await queryRunner.query(`DROP TYPE "public"."background_job_status"`);
  }
}
