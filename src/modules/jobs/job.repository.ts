import { type EntityManager } from "typeorm";
import { BackgroundJob } from "../../database/entities/background-job.entity.js";
import { JobStatus } from "../../database/enums/job-status.enum.js";
import { BackgroundJobType } from "../../queue/queue.constants.js";
import { Repository } from "typeorm";

export function getJobRepository(repository: Repository<BackgroundJob>) {
  return repository;
}

export async function findJobs({
  repository,
  status,
  limit,
  organizationId,
}: {
  repository: Repository<BackgroundJob>;
  status?: string;
  limit: number;
  organizationId?: string;
}) {
  const query = repository.createQueryBuilder("job").orderBy("job.created_at", "DESC").limit(limit);

  if (status) {
    query.andWhere("job.status = :status", {
      status,
    });
  }
  if (organizationId)
    query.andWhere("job.metadata ->> 'organizationId' = :organizationId", { organizationId });

  return query.getMany();
}

export async function findJobById(
  repository: Repository<BackgroundJob>,
  id: string,
  organizationId: string,
) {
  return repository
    .createQueryBuilder("job")
    .where("job.id = :id", { id })
    .andWhere("job.metadata ->> 'organizationId' = :organizationId", { organizationId })
    .getOne();
}

export async function createPendingAssignmentJob({
  manager,

  assignmentId,

  taskId,

  organizationId,

  assigneeUserId,

  requestedByUserId,
}: {
  manager: EntityManager;

  assignmentId: string;

  taskId: string;

  organizationId: string;

  assigneeUserId: string;

  requestedByUserId: string;
}): Promise<BackgroundJob> {
  const repository = manager.getRepository(BackgroundJob);

  const job = repository.create({
    bullJobId: null,

    type: BackgroundJobType.TASK_ASSIGNMENT_EMAIL,

    status: JobStatus.PENDING,

    metadata: {
      assignmentId,

      taskId,

      organizationId,

      assigneeUserId,

      requestedByUserId,
    },

    attempts: 0,

    errorMessage: null,

    startedAt: null,

    completedAt: null,

    failedAt: null,
  });

  return repository.save(job);
}
