import { createHash, randomBytes } from "node:crypto";

import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";

import { OrgRole, type OrgRole as OrgRoleType } from "../../database/enums/org-role.enum.js";
import { AppError } from "../../common/errors/app-error.js";

import { ErrorCode } from "../../common/errors/error-codes.js";

export interface AccessTokenPayload {
  userId: string;
  organizationId: string;
  role: OrgRoleType;
}

export function createAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(
    {
      org_id: payload.organizationId,

      role: payload.role,
    },
    env.JWT_ACCESS_SECRET,
    {
      subject: payload.userId,

      expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,

      issuer: "taskflow-api",

      audience: "taskflow-api",
    },
  );
}

export interface RefreshTokenResult {
  rawToken: string;
  tokenHash: string;
  expiresAt: Date;
}

export function createRefreshToken(): RefreshTokenResult {
  const rawToken = randomBytes(48).toString("base64url");

  return {
    rawToken,

    tokenHash: hashRefreshToken(rawToken),

    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
  };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface VerifiedAccessToken {
  userId: string;

  organizationId: string;

  role: OrgRoleType;
}

export function verifyAccessToken(token: string): VerifiedAccessToken {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      issuer: "taskflow-api",

      audience: "taskflow-api",
    });

    if (typeof decoded === "string") {
      throw new Error("Invalid token payload");
    }

    const userId = decoded.sub;

    const organizationId = decoded.org_id;

    const role = decoded.role;

    if (
      typeof userId !== "string" ||
      typeof organizationId !== "string" ||
      (role !== OrgRole.ORG_ADMIN && role !== OrgRole.MEMBER)
    ) {
      throw new Error("Invalid token claims");
    }

    return {
      userId,

      organizationId,

      role,
    };
  } catch {
    throw new AppError({
      message: "Invalid or expired access token",

      code: ErrorCode.AUTH_ACCESS_TOKEN_INVALID,

      statusCode: 401,

      details: {},
    });
  }
}
