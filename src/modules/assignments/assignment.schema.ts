import { z } from "zod";

export const taskAssignmentParamsSchema = z.object({
  taskId: z.string().uuid(),
});

export const createAssignmentSchema = z
  .object({
    user_id: z.string().uuid(),
  })
  .strict();

export const deleteAssignmentParamsSchema = z.object({
  taskId: z.string().uuid(),

  userId: z.string().uuid(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
