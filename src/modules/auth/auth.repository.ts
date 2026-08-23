import { type EntityManager } from "typeorm";

import { AppDataSource } from "../../config/database.js";

import { Organization } from "../../database/entities/organization.entity.js";

import { OrgMember } from "../../database/entities/org-member.entity.js";

import { RefreshToken } from "../../database/entities/refresh-token.entity.js";

import { User } from "../../database/entities/user.entity.js";

import { type OrgRole } from "../../database/enums/org-role.enum.js";

export interface RegistrationData {
  name: string;
  email: string;
  passwordHash: string;
  organizationName: string;
  organizationSlug: string;
  role: OrgRole;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return AppDataSource.getRepository(User).findOne({
    where: {
      email,
    },
  });
}

export async function findOrganizationBySlug(slug: string): Promise<Organization | null> {
  return AppDataSource.getRepository(Organization).findOne({
    where: {
      slug,
    },
  });
}

export async function createRegistration(data: RegistrationData): Promise<{
  user: User;
  organization: Organization;
  membership: OrgMember;
}> {
  return AppDataSource.transaction(async (manager: EntityManager) => {
    const organizationRepository = manager.getRepository(Organization);

    const userRepository = manager.getRepository(User);

    const membershipRepository = manager.getRepository(OrgMember);

    const organization = await organizationRepository.save(
      organizationRepository.create({
        name: data.organizationName,

        slug: data.organizationSlug,
      }),
    );

    const user = await userRepository.save(
      userRepository.create({
        name: data.name,

        email: data.email,

        passwordHash: data.passwordHash,

        isActive: true,
      }),
    );

    const membership = await membershipRepository.save(
      membershipRepository.create({
        organizationId: organization.id,

        userId: user.id,

        role: data.role,
      }),
    );

    return {
      user,
      organization,
      membership,
    };
  });
}

export async function findLoginContext(
  email: string,
  organizationSlug: string,
): Promise<OrgMember | null> {
  return AppDataSource.getRepository(OrgMember)
    .createQueryBuilder("membership")
    .innerJoinAndSelect("membership.user", "user")
    .innerJoinAndSelect("membership.organization", "organization")
    .where("LOWER(user.email) = LOWER(:email)", {
      email,
    })
    .andWhere("organization.slug = :organizationSlug", {
      organizationSlug,
    })
    .getOne();
}

export async function saveRefreshToken({
  userId,
  organizationId,
  tokenHash,
  expiresAt,
}: {
  userId: string;
  organizationId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<RefreshToken> {
  const repository = AppDataSource.getRepository(RefreshToken);

  return repository.save(
    repository.create({
      userId,
      organizationId,
      tokenHash,
      expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
    }),
  );
}

export async function findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
  return AppDataSource.getRepository(RefreshToken).findOne({
    where: {
      tokenHash,
    },
  });
}

export async function findMembership(
  userId: string,
  organizationId: string,
): Promise<OrgMember | null> {
  return AppDataSource.getRepository(OrgMember).findOne({
    where: {
      userId,
      organizationId,
    },

    relations: {
      user: true,
      organization: true,
    },
  });
}

export async function revokeRefreshToken(refreshToken: RefreshToken): Promise<void> {
  refreshToken.revokedAt = new Date();

  await AppDataSource.getRepository(RefreshToken).save(refreshToken);
}

export async function rotateRefreshToken({
  currentToken,
  newTokenHash,
  newExpiresAt,
}: {
  currentToken: RefreshToken;
  newTokenHash: string;
  newExpiresAt: Date;
}): Promise<RefreshToken> {
  return AppDataSource.transaction(async (manager) => {
    const repository = manager.getRepository(RefreshToken);

    const newToken = await repository.save(
      repository.create({
        userId: currentToken.userId,

        organizationId: currentToken.organizationId,

        tokenHash: newTokenHash,

        expiresAt: newExpiresAt,

        revokedAt: null,

        replacedByTokenId: null,
      }),
    );

    currentToken.revokedAt = new Date();

    currentToken.replacedByTokenId = newToken.id;

    await repository.save(currentToken);

    return newToken;
  });
}
