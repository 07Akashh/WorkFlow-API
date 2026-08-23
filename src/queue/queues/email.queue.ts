import { Queue } from "bullmq";

import { bullMqProducerConnection } from "../../config/bullmq.js";

import { JobName, QueueName } from "../queue.constants.js";

import { type AssignmentEmailJobData } from "../jobs/assignment-email.job.js";

let emailQueue: Queue<AssignmentEmailJobData> | null = null;

function getEmailQueue(): Queue<AssignmentEmailJobData> {
  if (!emailQueue) {
    emailQueue = new Queue<AssignmentEmailJobData>(QueueName.EMAIL, {
      connection: bullMqProducerConnection,

      defaultJobOptions: {
        /*
         * One initial attempt plus three retries (1s, 2s, 4s).
         */
        attempts: 4,

        backoff: {
          type: "exponential",

          delay: 1_000,
        },

        removeOnComplete: false,

        removeOnFail: false,
      },
    });
  }

  return emailQueue;
}

export async function connectEmailQueue(): Promise<void> {
  await getEmailQueue().waitUntilReady();
}

export async function closeEmailQueue(): Promise<void> {
  if (!emailQueue) {
    return;
  }

  await emailQueue.close();

  emailQueue = null;
}

export async function enqueueAssignmentEmail({
  jobId,
  data,
}: {
  jobId: string;
  data: AssignmentEmailJobData;
}) {
  // A queue accepts jobs without any worker online. Redis retains them in the
  // waiting state until a worker reconnects.
  return getEmailQueue().add(JobName.TASK_ASSIGNMENT_EMAIL, data, {
    jobId,
    attempts: 4,
    backoff: {
      type: "exponential",
      delay: 1_000,
    },
    removeOnComplete: {
      age: 86400,
    },

    removeOnFail: false,
  });
}
