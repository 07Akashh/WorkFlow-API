import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),

  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),

  password: z.string().min(8).max(128),

  organization_name: z.string().trim().min(2).max(150),

  organization_slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(150)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Organization slug must contain lowercase letters, numbers, and hyphens only",
    ),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),

  password: z.string().min(1),

  organization_slug: z.string().trim().toLowerCase(),
});

export const refreshSchema = z.object({
  refresh_token: z.string().min(20),
});

export const logoutSchema = refreshSchema;

export type RegisterInput = z.infer<typeof registerSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
