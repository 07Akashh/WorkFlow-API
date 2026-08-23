import { AppDataSource } from "../../config/database.js";

import { BackgroundJob } from "../../database/entities/background-job.entity.js";

import { findJobs, findJobById } from "./job.repository.js";
import { AppError } from "../../common/errors/app-error.js";
import { ErrorCode } from "../../common/errors/error-codes.js";

export async function listJobs({
  status,
  limit = 20,
  organizationId,
}: {
  status?: string;
  limit?: number;
  organizationId: string;
}) {
  const repository = AppDataSource.getRepository(BackgroundJob);

  return findJobs({
    repository,
    status,
    limit,
    organizationId,
  });
}

export async function getJob(id: string, organizationId: string) {
  const repository = AppDataSource.getRepository(BackgroundJob);

  const job = await findJobById(repository, id, organizationId);

  if (!job) {
    throw new AppError({
      message: "Job not found",
      code: ErrorCode.JOB_NOT_FOUND,
      statusCode: 404,
      details: {},
    });
  }

  return job;
}
