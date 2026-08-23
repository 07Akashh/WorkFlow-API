import { AppDataSource } from "../../config/database.js";

import { Task } from "../../database/entities/task.entity.js";

import { type CreateTaskInput, type ListTasksQuery, type UpdateTaskInput } from "./task.schema.js";

import { decodeCursor, encodeCursor } from "../../common/pagination/cursor.js";

export async function createTask({
  projectId,
  createdByUserId,
  input,
}: {
  projectId: string;
  createdByUserId: string;
  input: CreateTaskInput;
}): Promise<Task> {
  const repository = AppDataSource.getRepository(Task);

  const task = repository.create({
    projectId,

    createdByUserId,

    title: input.title,

    description: input.description ?? null,

    status: input.status,

    priority: input.priority,

    dueDate: input.due_date ?? null,
  });

  return repository.save(task);
}

export interface TaskOwnership {
  taskId: string;

  projectId: string;

  organizationId: string;

  taskDeletedAt: Date | null;

  projectDeletedAt: Date | null;
}

export async function findTaskOwnership(taskId: string): Promise<TaskOwnership | null> {
  const row = await AppDataSource.getRepository(Task)
    .createQueryBuilder("task")
    .withDeleted()
    .innerJoin("task.project", "project")
    .select("task.id", "task_id")
    .addSelect("task.project_id", "project_id")
    .addSelect("task.deleted_at", "task_deleted_at")
    .addSelect("project.organization_id", "organization_id")
    .addSelect("project.deleted_at", "project_deleted_at")
    .where("task.id = :taskId", {
      taskId,
    })
    .getRawOne<{
      task_id: string;

      project_id: string;

      task_deleted_at: Date | null;

      organization_id: string;

      project_deleted_at: Date | null;
    }>();

  if (!row) {
    return null;
  }

  return {
    taskId: row.task_id,

    projectId: row.project_id,

    organizationId: row.organization_id,

    taskDeletedAt: row.task_deleted_at,

    projectDeletedAt: row.project_deleted_at,
  };
}

export async function findTaskById({
  taskId,
  organizationId,
}: {
  taskId: string;
  organizationId: string;
}): Promise<Task | null> {
  return AppDataSource.getRepository(Task)
    .createQueryBuilder("task")
    .innerJoin("task.project", "project")
    .where("task.id = :taskId", {
      taskId,
    })
    .andWhere("project.organization_id = :organizationId", {
      organizationId,
    })
    .andWhere("task.deleted_at IS NULL")
    .andWhere("project.deleted_at IS NULL")
    .getOne();
}

export async function listTasks({
  projectId,
  organizationId,
  filters,
}: {
  projectId: string;
  organizationId: string;
  filters: ListTasksQuery;
}): Promise<{
  data: Task[];
  nextCursor: string | null;
}> {
  const query = AppDataSource.getRepository(Task)
    .createQueryBuilder("task")
    .innerJoin("task.project", "project")
    .where("task.project_id = :projectId", {
      projectId,
    })
    .andWhere("project.organization_id = :organizationId", {
      organizationId,
    })
    .andWhere("task.deleted_at IS NULL")
    .andWhere("project.deleted_at IS NULL");

  /*
   * Status filter
   */
  if (filters.status) {
    query.andWhere("task.status = :status", {
      status: filters.status,
    });
  }

  /*
   * Priority filter
   */
  if (filters.priority) {
    query.andWhere("task.priority = :priority", {
      priority: filters.priority,
    });
  }

  /*
   * Assignee filter.
   *
   * Assignment management comes in
   * Step 12, but seeded assignments
   * already allow us to support this
   * required query now.
   */
  if (filters.assignee_id) {
    query.innerJoin("task.assignments", "assignment", "assignment.user_id = :assigneeId", {
      assigneeId: filters.assignee_id,
    });
  }

  /*
   * Due-date range.
   */
  if (filters.due_from) {
    query.andWhere("task.due_date >= :dueFrom", {
      dueFrom: filters.due_from,
    });
  }

  if (filters.due_to) {
    query.andWhere("task.due_date <= :dueTo", {
      dueTo: filters.due_to,
    });
  }

  /*
   * Cursor pagination.
   */
  if (filters.cursor) {
    const cursor = decodeCursor(filters.cursor);

    query.andWhere(
      `(
        task.created_at < :cursorCreatedAt
        OR (
          task.created_at = :cursorCreatedAt
          AND task.id < :cursorId
        )
      )`,
      {
        cursorCreatedAt: cursor.createdAt,

        cursorId: cursor.id,
      },
    );
  }

  query
    .orderBy("task.created_at", "DESC")
    .addOrderBy("task.id", "DESC")
    .take(filters.limit + 1);

  const results = await query.getMany();

  const hasMore = results.length > filters.limit;

  const data = hasMore ? results.slice(0, filters.limit) : results;

  const last = data.at(-1);

  return {
    data,

    nextCursor:
      hasMore && last
        ? encodeCursor({
            createdAt: last.createdAt.toISOString(),

            id: last.id,
          })
        : null,
  };
}

export async function updateTask({
  task,
  input,
}: {
  task: Task;
  input: UpdateTaskInput;
}): Promise<Task> {
  if (input.title !== undefined) {
    task.title = input.title;
  }

  if (input.description !== undefined) {
    task.description = input.description;
  }

  if (input.status !== undefined) {
    task.status = input.status;
  }

  if (input.priority !== undefined) {
    task.priority = input.priority;
  }

  if (input.due_date !== undefined) {
    task.dueDate = input.due_date;
  }

  return AppDataSource.getRepository(Task).save(task);
}

export async function deleteTask(task: Task): Promise<void> {
  await AppDataSource.getRepository(Task).softRemove(task);
}

export async function getStatusCounts({
  projectId,
  organizationId,
}: {
  projectId: string;
  organizationId: string;
}) {
  const rows = await AppDataSource.getRepository(Task)
    .createQueryBuilder("task")
    .innerJoin("task.project", "project")
    .select("task.status", "status")
    .addSelect("COUNT(task.id)", "count")
    .where("task.project_id = :projectId", {
      projectId,
    })
    .andWhere("project.organization_id = :organizationId", {
      organizationId,
    })
    .andWhere("task.deleted_at IS NULL")
    .andWhere("project.deleted_at IS NULL")
    .groupBy("task.status")
    .getRawMany<{
      status: string;
      count: string;
    }>();

  return rows;
}
