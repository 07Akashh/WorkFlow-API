import { AppDataSource } from "../../config/database.js";

import { OrgMember } from "../../database/entities/org-member.entity.js";

export async function membershipExists({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}): Promise<boolean> {
  const count = await AppDataSource.getRepository(OrgMember).count({
    where: {
      userId,
      organizationId,
    },
  });

  return count > 0;
}
