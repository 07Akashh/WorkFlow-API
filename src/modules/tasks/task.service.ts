import { AppError } from "../../common/errors/app-error.js";

import { ErrorCode } from "../../common/errors/error-codes.js";

// import { TaskPriority } from "../../database/enums/task-priority.enum.js";

import { TaskStatus } from "../../database/enums/task-status.enum.js";

import { type Task } from "../../database/entities/task.entity.js";

import { type AuthContext } from "../auth/auth.types.js";

import { assertProjectAccess } from "../projects/project.service.js";

import { type CreateTaskInput, type ListTasksQuery, type UpdateTaskInput } from "./task.schema.js";

import * as taskRepository from "./task.repository.js";

function mapTask(task: Task) {
  return {
    id: task.id,

    project_id: task.projectId,

    title: task.title,

    description: task.description,

    status: task.status,

    priority: task.priority,

    due_date: task.dueDate,

    created_by_user_id: task.createdByUserId,

    created_at: task.createdAt,

    updated_at: task.updatedAt,
  };
}

export async function assertTaskAccess({
  auth,
  taskId,
}: {
  auth: AuthContext;
  taskId: string;
}): Promise<void> {
  const ownership = await taskRepository.findTaskOwnership(taskId);

  if (!ownership || ownership.taskDeletedAt || ownership.projectDeletedAt) {
    throw new AppError({
      message: "Task not found",
      code: ErrorCode.TASK_NOT_FOUND,
      statusCode: 404,
      details: {},
    });
  }

  if (ownership.organizationId !== auth.organizationId) {
    throw new AppError({
      message: "Access to this task is forbidden",
      code: ErrorCode.TASK_FORBIDDEN,
      statusCode: 403,
      details: {},
    });
  }
}
export async function createTask(auth: AuthContext, projectId: string, input: CreateTaskInput) {
  await assertProjectAccess({
    auth,
    projectId,
  });

  const task = await taskRepository.createTask({
    projectId,

    createdByUserId: auth.userId,

    input,
  });

  return mapTask(task);
}

export async function listTasks(auth: AuthContext, projectId: string, filters: ListTasksQuery) {
  await assertProjectAccess({
    auth,
    projectId,
  });

  const result = await taskRepository.listTasks({
    projectId,

    organizationId: auth.organizationId,

    filters,
  });

  return {
    data: result.data.map(mapTask),

    next_cursor: result.nextCursor,
  };
}

export async function getTask(auth: AuthContext, taskId: string) {
  await assertTaskAccess({
    auth,
    taskId,
  });

  const task = await taskRepository.findTaskById({
    taskId,

    organizationId: auth.organizationId,
  });

  if (!task) {
    throw new AppError({
      message: "Task not found",

      code: ErrorCode.TASK_NOT_FOUND,

      statusCode: 404,
      details: {},
    });
  }

  return mapTask(task);
}

export async function updateTask({
  auth,
  taskId,
  input,
}: {
  auth: AuthContext;
  taskId: string;
  input: UpdateTaskInput;
}) {
  await assertTaskAccess({
    auth,
    taskId,
  });

  const task = await taskRepository.findTaskById({
    taskId,

    organizationId: auth.organizationId,
  });

  if (!task) {
    throw new AppError({
      message: "Task not found",

      code: ErrorCode.TASK_NOT_FOUND,

      statusCode: 404,
      details: {},
    });
  }

  const updated = await taskRepository.updateTask({
    task,
    input,
  });

  return mapTask(updated);
}

export async function deleteTask({
  auth,
  taskId,
}: {
  auth: AuthContext;
  taskId: string;
}): Promise<void> {
  await assertTaskAccess({
    auth,
    taskId,
  });

  const task = await taskRepository.findTaskById({
    taskId,

    organizationId: auth.organizationId,
  });

  if (!task) {
    throw new AppError({
      message: "Task not found",

      code: ErrorCode.TASK_NOT_FOUND,

      statusCode: 404,
      details: {},
    });
  }

  await taskRepository.deleteTask(task);
}

export async function getProjectDashboard(auth: AuthContext, projectId: string) {
  await assertProjectAccess({
    auth,
    projectId,
  });

  const rows = await taskRepository.getStatusCounts({
    projectId,

    organizationId: auth.organizationId,
  });

  const counts = {
    [TaskStatus.TODO]: 0,

    [TaskStatus.IN_PROGRESS]: 0,

    [TaskStatus.REVIEW]: 0,

    [TaskStatus.DONE]: 0,
  };

  for (const row of rows) {
    if (row.status in counts) {
      counts[row.status as keyof typeof counts] = Number(row.count);
    }
  }

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return {
    project_id: projectId,

    total_tasks: total,

    by_status: {
      todo: counts[TaskStatus.TODO],

      in_progress: counts[TaskStatus.IN_PROGRESS],

      review: counts[TaskStatus.REVIEW],

      done: counts[TaskStatus.DONE],
    },
  };
}
