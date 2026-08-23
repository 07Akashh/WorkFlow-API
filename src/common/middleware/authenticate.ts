import { type FastifyReply, type FastifyRequest } from "fastify";

import { AppError } from "../errors/app-error.js";

import { ErrorCode } from "../errors/error-codes.js";

import { verifyAccessToken } from "../../modules/auth/auth.token.js";
import { membershipExists } from "../../modules/auth/auth-context.repository.js";

export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const authorization = request.headers.authorization;

  if (!authorization) {
    throw new AppError({
      message: "Authentication required",

      code: ErrorCode.UNAUTHORIZED,

      statusCode: 401,
    });
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new AppError({
      message: "Invalid authorization header",

      code: ErrorCode.UNAUTHORIZED,

      statusCode: 401,
    });
  }
  const auth = verifyAccessToken(token);

  const activeMembership = await membershipExists({
    userId: auth.userId,

    organizationId: auth.organizationId,
  });

  if (!activeMembership) {
    throw new AppError({
      message: "Authentication context is no longer valid",

      code: ErrorCode.UNAUTHORIZED,

      statusCode: 401,

      details: {},
    });
  }

  request.auth = auth;
}
