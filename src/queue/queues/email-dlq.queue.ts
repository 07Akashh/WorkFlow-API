import { Queue } from "bullmq";

import { bullMqProducerConnection } from "../../config/bullmq.js";

export const EMAIL_DLQ_NAME = "taskflow-email-dlq";

let emailDlq: Queue | null = null;

function getEmailDlq(): Queue {
  if (!emailDlq) emailDlq = new Queue(EMAIL_DLQ_NAME, { connection: bullMqProducerConnection });
  return emailDlq;
}

export async function moveEmailJobToDlq(job: {
  id?: string;
  name: string;
  data: unknown;
  failedReason?: string;
}): Promise<void> {
  await getEmailDlq().add(
    job.name,
    { originalJobId: job.id, payload: job.data, failedReason: job.failedReason },
    {
      jobId: job.id ? `failed-${job.id}` : undefined,
      removeOnComplete: false,
      removeOnFail: false,
    },
  );
}

export async function closeEmailDlq(): Promise<void> {
  await emailDlq?.close();
  emailDlq = null;
}
