import { z } from "zod";

export const commentTaskParamsSchema = z.object({
  taskId: z.string().uuid(),
});

export const createCommentSchema = z
  .object({
    body: z.string().trim().min(1).max(5000),
  })
  .strict();

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
