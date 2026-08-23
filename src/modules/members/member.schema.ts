import { z } from "zod";

import { OrgRole } from "../../database/enums/org-role.enum.js";

export const addMemberSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),

    email: z
      .string()
      .trim()
      .email()
      .transform((value) => value.toLowerCase()),

    password: z.string().min(8).max(128).optional(),

    role: z.enum([OrgRole.ORG_ADMIN, OrgRole.MEMBER]).default(OrgRole.MEMBER),
  })
  .strict();

export const updateMemberRoleSchema = z
  .object({
    role: z.enum([OrgRole.ORG_ADMIN, OrgRole.MEMBER]),
  })
  .strict();

export const memberParamsSchema = z.object({
  userId: z.string().uuid(),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;
