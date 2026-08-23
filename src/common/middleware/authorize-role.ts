import { type FastifyReply, type FastifyRequest } from "fastify";

import { AppError } from "../errors/app-error.js";

import { ErrorCode } from "../errors/error-codes.js";

import { type OrgRole } from "../../database/enums/org-role.enum.js";

export function authorizeRoles(...allowedRoles: OrgRole[]) {
  return async function authorizeRole(
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> {
    if (!allowedRoles.includes(request.auth.role)) {
      throw new AppError({
        message: "You do not have permission to perform this action",

        code: ErrorCode.FORBIDDEN,

        statusCode: 403,

        details: {},
      });
    }
  };
}
