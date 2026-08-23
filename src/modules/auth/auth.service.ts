import bcrypt from "bcrypt";

import { env } from "../../config/env.js";

import { AppError } from "../../common/errors/app-error.js";

import { ErrorCode } from "../../common/errors/error-codes.js";

import { OrgRole } from "../../database/enums/org-role.enum.js";

import { createAccessToken, createRefreshToken, hashRefreshToken } from "./auth.token.js";

import * as authRepository from "./auth.repository.js";

import { type LoginInput, type RegisterInput } from "./auth.schema.js";

function buildAuthResponse({
  userId,
  name,
  email,
  organizationId,
  organizationName,
  organizationSlug,
  role,
  accessToken,
  refreshToken,
}: {
  userId: string;
  name: string;
  email: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: OrgRole;
  accessToken: string;
  refreshToken: string;
}) {
  return {
    token_type: "Bearer",

    access_token: accessToken,

    expires_in: env.ACCESS_TOKEN_TTL_SECONDS,

    refresh_token: refreshToken,

    refresh_expires_in: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,

    user: {
      id: userId,

      name,

      email,
    },

    organization: {
      id: organizationId,

      name: organizationName,

      slug: organizationSlug,

      role,
    },
  };
}

export async function register(input: RegisterInput) {
  const existingUser = await authRepository.findUserByEmail(input.email);

  if (existingUser) {
    throw new AppError({
      message: "Email is already registered",

      code: ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,

      statusCode: 409,
    });
  }

  const existingOrganization = await authRepository.findOrganizationBySlug(input.organization_slug);

  if (existingOrganization) {
    throw new AppError({
      message: "Organization slug is already in use",

      code: ErrorCode.AUTH_ORGANIZATION_ALREADY_EXISTS,

      statusCode: 409,
    });
  }

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  const { user, organization, membership } = await authRepository.createRegistration({
    name: input.name,

    email: input.email,

    passwordHash,

    organizationName: input.organization_name,

    organizationSlug: input.organization_slug,

    role: OrgRole.ORG_ADMIN,
  });

  const refresh = createRefreshToken();

  await authRepository.saveRefreshToken({
    userId: user.id,

    organizationId: organization.id,

    tokenHash: refresh.tokenHash,

    expiresAt: refresh.expiresAt,
  });

  const accessToken = createAccessToken({
    userId: user.id,

    organizationId: organization.id,

    role: membership.role,
  });

  return buildAuthResponse({
    userId: user.id,

    name: user.name,

    email: user.email,

    organizationId: organization.id,

    organizationName: organization.name,

    organizationSlug: organization.slug,

    role: membership.role,

    accessToken,

    refreshToken: refresh.rawToken,
  });
}

export async function login(input: LoginInput) {
  const membership = await authRepository.findLoginContext(input.email, input.organization_slug);

  if (!membership || !membership.user.isActive) {
    throw new AppError({
      message: "Invalid email or password",

      code: ErrorCode.AUTH_INVALID_CREDENTIALS,

      statusCode: 401,
    });
  }

  const passwordMatches = await bcrypt.compare(input.password, membership.user.passwordHash);

  if (!passwordMatches) {
    throw new AppError({
      message: "Invalid email or password",

      code: ErrorCode.AUTH_INVALID_CREDENTIALS,

      statusCode: 401,
    });
  }

  const refresh = createRefreshToken();

  await authRepository.saveRefreshToken({
    userId: membership.user.id,

    organizationId: membership.organization.id,

    tokenHash: refresh.tokenHash,

    expiresAt: refresh.expiresAt,
  });

  const accessToken = createAccessToken({
    userId: membership.user.id,

    organizationId: membership.organization.id,

    role: membership.role,
  });

  return buildAuthResponse({
    userId: membership.user.id,

    name: membership.user.name,

    email: membership.user.email,

    organizationId: membership.organization.id,

    organizationName: membership.organization.name,

    organizationSlug: membership.organization.slug,

    role: membership.role,

    accessToken,

    refreshToken: refresh.rawToken,
  });
}

export async function refresh(rawRefreshToken: string) {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const storedToken = await authRepository.findRefreshToken(tokenHash);

  const now = new Date();

  if (!storedToken || storedToken.revokedAt || storedToken.expiresAt <= now) {
    throw new AppError({
      message: "Invalid or expired refresh token",

      code: ErrorCode.AUTH_REFRESH_TOKEN_INVALID,

      statusCode: 401,
    });
  }

  const membership = await authRepository.findMembership(
    storedToken.userId,
    storedToken.organizationId,
  );

  if (!membership || !membership.user.isActive) {
    throw new AppError({
      message: "Invalid or expired refresh token",

      code: ErrorCode.AUTH_REFRESH_TOKEN_INVALID,

      statusCode: 401,
    });
  }

  const nextRefresh = createRefreshToken();

  await authRepository.rotateRefreshToken({
    currentToken: storedToken,

    newTokenHash: nextRefresh.tokenHash,

    newExpiresAt: nextRefresh.expiresAt,
  });

  const accessToken = createAccessToken({
    userId: membership.user.id,

    organizationId: membership.organization.id,

    role: membership.role,
  });

  return buildAuthResponse({
    userId: membership.user.id,

    name: membership.user.name,

    email: membership.user.email,

    organizationId: membership.organization.id,

    organizationName: membership.organization.name,

    organizationSlug: membership.organization.slug,

    role: membership.role,

    accessToken,

    refreshToken: nextRefresh.rawToken,
  });
}

export async function logout(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const storedToken = await authRepository.findRefreshToken(tokenHash);

  if (!storedToken) {
    return;
  }

  if (storedToken.revokedAt) {
    return;
  }

  await authRepository.revokeRefreshToken(storedToken);
}
