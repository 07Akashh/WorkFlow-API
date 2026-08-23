import { type Job, Worker } from "bullmq";

import { AppDataSource } from "../config/database.js";
import { bullMqWorkerConnection } from "../config/bullmq.js";
import { QueueName, JobName } from "../queue/queue.constants.js";
import { BackgroundJob } from "../database/entities/background-job.entity.js";
import { TaskAssignment } from "../database/entities/task-assignment.entity.js";
import {
  sendAssignmentEmail,
  verifyEmailTransport,
} from "../modules/notifications/email.service.js";
import { JobStatus } from "../database/enums/job-status.enum.js";
import { moveEmailJobToDlq } from "../queue/queues/email-dlq.queue.js";

export let emailWorker: Worker | null = null;

async function recordFailedJob(job: Job, error: Error): Promise<void> {
  const finalAttempt = job.attemptsMade >= (job.opts.attempts ?? 1);
  const repository = AppDataSource.getRepository(BackgroundJob);
  const backgroundJob = await repository.findOneBy({ id: job.data.backgroundJobId });
  if (!finalAttempt) {
    // BullMQ has scheduled the exponential retry; this job is no longer active.
    if (backgroundJob) {
      backgroundJob.status = JobStatus.PENDING;
      backgroundJob.attempts = job.attemptsMade;
      backgroundJob.errorMessage = error.message;
      await repository.save(backgroundJob);
    }
    return;
  }

  if (backgroundJob) {
    backgroundJob.status = JobStatus.FAILED;
    backgroundJob.failedAt = new Date();
    backgroundJob.errorMessage = error.message;
    backgroundJob.attempts = job.attemptsMade;
    await repository.save(backgroundJob);
  }
  await moveEmailJobToDlq({
    id: job.id,
    name: job.name,
    data: job.data,
    failedReason: error.message,
  });
}

export async function startEmailWorker(): Promise<Worker> {
  await AppDataSource.initialize();
  await verifyEmailTransport();

  const worker = new Worker(
    QueueName.EMAIL,
    async (job) => {
      if (job.name !== JobName.TASK_ASSIGNMENT_EMAIL) return;

      const { backgroundJobId, assignmentId } = job.data;
      const manager = AppDataSource.manager;
      const backgroundJob = await manager.findOneBy(BackgroundJob, { id: backgroundJobId });
      if (!backgroundJob) throw new Error("Background job not found");

      backgroundJob.status = JobStatus.ACTIVE;
      backgroundJob.attempts = job.attemptsMade + 1;
      backgroundJob.startedAt ??= new Date();
      await manager.save(backgroundJob);

      const assignment = await manager.findOne(TaskAssignment, {
        where: { id: assignmentId },
        relations: { user: true, task: true },
      });
      if (!assignment) throw new Error("Assignment not found");

      await sendAssignmentEmail({ email: assignment.user.email, taskTitle: assignment.task.title });
      backgroundJob.status = JobStatus.COMPLETED;
      backgroundJob.completedAt = new Date();
      backgroundJob.errorMessage = null;
      await manager.save(backgroundJob);
    },
    {
      connection: bullMqWorkerConnection,
      concurrency: 5,
      // A graceful close keeps active jobs from being incorrectly treated as stalled.
      lockDuration: 60_000,
      maxStalledCount: 1,
    },
  );

  worker.on("failed", (job, error) => {
    if (!job) return;
    void recordFailedJob(job, error).catch((handlerError: unknown) => {
      // EventEmitter does not await async listeners. Catch here to avoid an
      // unhandled rejection taking down the worker process.
      console.error("Unable to record failed email job", handlerError);
    });
  });

  worker.on("error", (error) => console.error("Email worker connection error", error));

  await worker.waitUntilReady();
  emailWorker = worker;
  return worker;
}

export async function stopEmailWorker(): Promise<void> {
  await emailWorker?.close();
  emailWorker = null;
  if (AppDataSource.isInitialized) await AppDataSource.destroy();
}
