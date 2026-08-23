import { type EntityManager } from "typeorm";

import { AppDataSource } from "../../config/database.js";

import { OrgMember } from "../../database/entities/org-member.entity.js";

import { User } from "../../database/entities/user.entity.js";

import { OrgRole } from "../../database/enums/org-role.enum.js";

export async function findUserByEmail(email: string): Promise<User | null> {
  return AppDataSource.getRepository(User).findOne({
    where: {
      email,
    },
  });
}

export async function findMembership({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}): Promise<OrgMember | null> {
  return AppDataSource.getRepository(OrgMember).findOne({
    where: {
      organizationId,
      userId,
    },

    relations: {
      user: true,
    },
  });
}

export async function listMembers(organizationId: string): Promise<OrgMember[]> {
  return AppDataSource.getRepository(OrgMember)
    .createQueryBuilder("membership")
    .innerJoinAndSelect("membership.user", "user")
    .where("membership.organization_id = :organizationId", {
      organizationId,
    })
    .orderBy("membership.created_at", "ASC")
    .getMany();
}

export async function createUserAndMembership({
  organizationId,
  name,
  email,
  passwordHash,
  role,
}: {
  organizationId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: OrgRole;
}): Promise<OrgMember> {
  return AppDataSource.transaction(async (manager: EntityManager) => {
    const userRepository = manager.getRepository(User);

    const membershipRepository = manager.getRepository(OrgMember);

    const user = await userRepository.save(
      userRepository.create({
        name,
        email,
        passwordHash,
        isActive: true,
      }),
    );

    return membershipRepository.save(
      membershipRepository.create({
        organizationId,
        userId: user.id,
        role,
      }),
    );
  });
}

export async function createMembership({
  organizationId,
  userId,
  role,
}: {
  organizationId: string;
  userId: string;
  role: OrgRole;
}): Promise<OrgMember> {
  const repository = AppDataSource.getRepository(OrgMember);

  return repository.save(
    repository.create({
      organizationId,
      userId,
      role,
    }),
  );
}

export async function countAdmins(organizationId: string): Promise<number> {
  return AppDataSource.getRepository(OrgMember).count({
    where: {
      organizationId,
      role: OrgRole.ORG_ADMIN,
    },
  });
}

export async function updateRole(membership: OrgMember, role: OrgRole): Promise<OrgMember> {
  membership.role = role;

  return AppDataSource.getRepository(OrgMember).save(membership);
}

export async function deleteMembership(membership: OrgMember): Promise<void> {
  await AppDataSource.getRepository(OrgMember).remove(membership);
}
