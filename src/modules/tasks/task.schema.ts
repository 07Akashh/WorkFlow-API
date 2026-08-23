import { z } from "zod";

import { TaskPriority } from "../../database/enums/task-priority.enum.js";

import { TaskStatus } from "../../database/enums/task-status.enum.js";

const statusSchema = z.enum([
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
  TaskStatus.DONE,
]);

const prioritySchema = z.enum([
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.URGENT,
]);

export const taskParamsSchema = z.object({
  taskId: z.string().uuid(),
});

export const projectTaskParamsSchema = z.object({
  projectId: z.string().uuid(),
});

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(2).max(250),

    description: z.string().trim().max(10000).nullable().optional(),

    status: statusSchema.default(TaskStatus.TODO),

    priority: prioritySchema.default(TaskPriority.MEDIUM),

    due_date: z.coerce.date().nullable().optional(),
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(2).max(250).optional(),

    description: z.string().trim().max(10000).nullable().optional(),

    status: statusSchema.optional(),

    priority: prioritySchema.optional(),

    due_date: z.coerce.date().nullable().optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field must be provided",
  });

export const listTasksQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),

    cursor: z.string().min(1).optional(),

    status: statusSchema.optional(),

    priority: prioritySchema.optional(),

    assignee_id: z.string().uuid().optional(),

    due_from: z.coerce.date().optional(),

    due_to: z.coerce.date().optional(),
  })
  .refine((input) => !input.due_from || !input.due_to || input.due_from <= input.due_to, {
    message: "due_from must be before due_to",

    path: ["due_from"],
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
