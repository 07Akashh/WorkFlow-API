import { QueryFailedError } from "typeorm";

import { AppError } from "../../common/errors/app-error.js";

import { ErrorCode } from "../../common/errors/error-codes.js";

import { type AuthContext } from "../auth/auth.types.js";

import { assertTaskAccess } from "../tasks/task.service.js";

import { type CreateAssignmentInput } from "./assignment.schema.js";

import * as assignmentRepository from "./assignment.repository.js";

import { AppDataSource } from "../../config/database.js";

import { enqueueAssignmentEmail } from "../../queue/queues/email.queue.js";

import { QueueEnqueueError } from "../../queue/queue-error.js";

import * as jobRepository from "../jobs/job.repository.js";

function mapAssignment(
  assignment: NonNullable<Awaited<ReturnType<typeof assignmentRepository.findAssignment>>>,
) {
  return {
    id: assignment.id,

    task_id: assignment.taskId,

    user: {
      id: assignment.user.id,

      name: assignment.user.name,

      email: assignment.user.email,
    },

    assigned_by_user_id: assignment.assignedByUserId,

    assigned_at: assignment.createdAt,
  };
}

export async function assignUser({
  auth,
  taskId,
  input,
}: {
  auth: AuthContext;
  taskId: string;
  input: CreateAssignmentInput;
}) {
  await assertTaskAccess({
    auth,
    taskId,
  });

  const membership = await assignmentRepository.findOrganizationMember({
    organizationId: auth.organizationId,

    userId: input.user_id,
  });

  let backgroundJobId!: string;

  if (!membership || !membership.user.isActive) {
    throw new AppError({
      message: "Assignee must belong to your organization",

      code: ErrorCode.ASSIGNEE_NOT_IN_ORGANIZATION,

      statusCode: 400,

      details: {},
    });
  }

  const existingAssignment = await assignmentRepository.findAssignment({
    taskId,
    userId: input.user_id,
  });

  if (existingAssignment) {
    throw new AppError({
      message: "User is already assigned to this task",

      code: ErrorCode.TASK_ASSIGNMENT_ALREADY_EXISTS,

      statusCode: 409,

      details: {},
    });
  }

  try {
    await AppDataSource.transaction(async (manager) => {
      const assignment = await assignmentRepository.createAssignmentWithManager({
        manager,

        taskId,

        userId: input.user_id,

        assignedByUserId: auth.userId,
      });

      const backgroundJob = await jobRepository.createPendingAssignmentJob({
        manager,

        assignmentId: assignment.id,

        taskId,

        organizationId: auth.organizationId,

        assigneeUserId: input.user_id,

        requestedByUserId: auth.userId,
      });

      try {
        const bullJob = await enqueueAssignmentEmail({
          jobId: backgroundJob.id,

          data: {
            backgroundJobId: backgroundJob.id,

            assignmentId: assignment.id,

            taskId,

            assigneeUserId: input.user_id,

            organizationId: auth.organizationId,

            requestedByUserId: auth.userId,
          },
        });

        // The transaction commits only after Redis confirms enqueueing. If
        // enqueueing fails, both the assignment and pending job are rolled back.
        backgroundJob.bullJobId = bullJob.id ?? backgroundJob.id;
        await manager.save(backgroundJob);
      } catch {
        throw new QueueEnqueueError("Unable to enqueue notification");
      }

      // createdAssignmentId = assignment.id;

      backgroundJobId = backgroundJob.id;
    });
  } catch (error) {
    if (error instanceof QueueEnqueueError) {
      throw new AppError({
        message: "Assignment could not be completed because notification queue is unavailable",

        code: ErrorCode.ASSIGNMENT_NOTIFICATION_ENQUEUE_FAILED,

        statusCode: 503,

        details: {},
      });
    }

    if (
      error instanceof QueryFailedError &&
      (
        error.driverError as {
          code?: string;
        }
      ).code === "23505"
    ) {
      throw new AppError({
        message: "User is already assigned to this task",

        code: ErrorCode.TASK_ASSIGNMENT_ALREADY_EXISTS,

        statusCode: 409,

        details: {},
      });
    }

    throw error;
  }

  const assignment = await assignmentRepository.findAssignment({
    taskId,

    userId: input.user_id,
  });

  if (!assignment) {
    throw new Error("Assignment was created but could not be loaded");
  }

  return {
    ...mapAssignment(assignment),

    notification_job_id: backgroundJobId,
  };
}

export async function listAssignments(auth: AuthContext, taskId: string) {
  await assertTaskAccess({
    auth,
    taskId,
  });

  const assignments = await assignmentRepository.listAssignments(taskId);

  return assignments.map((assignment) => ({
    id: assignment.id,

    task_id: assignment.taskId,

    user: {
      id: assignment.user.id,

      name: assignment.user.name,

      email: assignment.user.email,
    },

    assigned_by_user_id: assignment.assignedByUserId,

    assigned_at: assignment.createdAt,
  }));
}

export async function unassignUser({
  auth,
  taskId,
  userId,
}: {
  auth: AuthContext;
  taskId: string;
  userId: string;
}): Promise<void> {
  await assertTaskAccess({
    auth,
    taskId,
  });

  const assignment = await assignmentRepository.findAssignment({
    taskId,
    userId,
  });

  if (!assignment) {
    throw new AppError({
      message: "Task assignment not found",

      code: ErrorCode.TASK_ASSIGNMENT_NOT_FOUND,

      statusCode: 404,

      details: {},
    });
  }

  await assignmentRepository.deleteAssignment(assignment);
}
