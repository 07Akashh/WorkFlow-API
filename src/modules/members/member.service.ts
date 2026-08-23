import bcrypt from "bcrypt";

import { AppError } from "../../common/errors/app-error.js";

import { ErrorCode } from "../../common/errors/error-codes.js";

import { type AuthContext } from "../auth/auth.types.js";

import { env } from "../../config/env.js";

import { OrgRole } from "../../database/enums/org-role.enum.js";

import { type AddMemberInput } from "./member.schema.js";

import * as memberRepository from "./member.repository.js";

function mapMember(membership: Awaited<ReturnType<typeof memberRepository.findMembership>>) {
  if (!membership) {
    return null;
  }

  return {
    user_id: membership.userId,

    name: membership.user.name,

    email: membership.user.email,

    role: membership.role,

    joined_at: membership.createdAt,
  };
}

export async function listMembers(auth: AuthContext) {
  const memberships = await memberRepository.listMembers(auth.organizationId);

  return memberships.map((membership) => ({
    user_id: membership.userId,

    name: membership.user.name,

    email: membership.user.email,

    role: membership.role,

    joined_at: membership.createdAt,
  }));
}

export async function addMember(auth: AuthContext, input: AddMemberInput) {
  const existingUser = await memberRepository.findUserByEmail(input.email);

  if (existingUser) {
    const existingMembership = await memberRepository.findMembership({
      organizationId: auth.organizationId,

      userId: existingUser.id,
    });

    if (existingMembership) {
      throw new AppError({
        message: "User is already a member of this organization",

        code: ErrorCode.ORG_MEMBER_ALREADY_EXISTS,

        statusCode: 409,

        details: {},
      });
    }

    const membership = await memberRepository.createMembership({
      organizationId: auth.organizationId,

      userId: existingUser.id,

      role: input.role,
    });

    const hydrated = await memberRepository.findMembership({
      organizationId: auth.organizationId,

      userId: membership.userId,
    });

    return mapMember(hydrated);
  }

  if (!input.name || !input.password) {
    throw new AppError({
      message: "Name and password are required when creating a new user",

      code: ErrorCode.BAD_REQUEST,

      statusCode: 400,

      details: {
        required: ["name", "password"],
      },
    });
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  const membership = await memberRepository.createUserAndMembership({
    organizationId: auth.organizationId,

    name: input.name,

    email: input.email,

    passwordHash,

    role: input.role,
  });

  const hydrated = await memberRepository.findMembership({
    organizationId: auth.organizationId,

    userId: membership.userId,
  });

  return mapMember(hydrated);
}

export async function updateMemberRole({
  auth,
  targetUserId,
  role,
}: {
  auth: AuthContext;
  targetUserId: string;
  role: OrgRole;
}) {
  const membership = await memberRepository.findMembership({
    organizationId: auth.organizationId,

    userId: targetUserId,
  });

  if (!membership) {
    throw new AppError({
      message: "Organization member not found",

      code: ErrorCode.ORG_MEMBER_NOT_FOUND,

      statusCode: 404,

      details: {},
    });
  }

  if (membership.role === OrgRole.ORG_ADMIN && role === OrgRole.MEMBER) {
    const adminCount = await memberRepository.countAdmins(auth.organizationId);

    if (adminCount <= 1) {
      throw new AppError({
        message: "The last organization admin cannot be demoted",

        code: ErrorCode.ORG_LAST_ADMIN,

        statusCode: 409,

        details: {},
      });
    }
  }

  const updated = await memberRepository.updateRole(membership, role);

  const hydrated = await memberRepository.findMembership({
    organizationId: auth.organizationId,

    userId: updated.userId,
  });

  return mapMember(hydrated);
}

export async function removeMember({
  auth,
  targetUserId,
}: {
  auth: AuthContext;
  targetUserId: string;
}): Promise<void> {
  const membership = await memberRepository.findMembership({
    organizationId: auth.organizationId,

    userId: targetUserId,
  });

  if (!membership) {
    throw new AppError({
      message: "Organization member not found",

      code: ErrorCode.ORG_MEMBER_NOT_FOUND,

      statusCode: 404,

      details: {},
    });
  }

  if (membership.role === OrgRole.ORG_ADMIN) {
    const adminCount = await memberRepository.countAdmins(auth.organizationId);

    if (adminCount <= 1) {
      throw new AppError({
        message: "The last organization admin cannot be removed",

        code: ErrorCode.ORG_LAST_ADMIN,

        statusCode: 409,

        details: {},
      });
    }
  }

  await memberRepository.deleteMembership(membership);
}
