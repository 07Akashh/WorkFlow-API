import { z } from "zod";

export const createProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(200),

    description: z.string().trim().max(5000).nullable().optional(),
  })
  .strict();

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),

    description: z.string().trim().max(5000).nullable().optional(),
  })
  .strict()
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one field must be provided",
  });

export const projectParamsSchema = z.object({
  projectId: z.string().uuid(),
});

export const listProjectsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),

  cursor: z.string().min(1).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
