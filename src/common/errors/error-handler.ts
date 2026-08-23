import { type FastifyInstance, type FastifyReply } from "fastify";

import { ZodError } from "zod";

import { AppError } from "./app-error.js";
import { ErrorCode } from "./error-codes.js";

type FastifyLikeError = {
  code?: string;
  statusCode?: number;
  validation?: Array<{ instancePath?: string; message?: string; keyword?: string }>;
};

function sendError(
  reply: FastifyReply,
  statusCode: number,
  message: string,
  code: ErrorCode,
  details: Record<string, unknown> = {},
) {
  return reply.status(statusCode).send({ error: message, code, details });
}

/** Ensures expected client mistakes never become noisy 500 responses. */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    const fastifyError = error as FastifyLikeError;

    if (error instanceof AppError) {
      return sendError(reply, error.statusCode, error.message, error.code, error.details);
    }

    if (error instanceof ZodError) {
      return sendError(reply, 400, "Validation failed", ErrorCode.VALIDATION_ERROR, {
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        })),
      });
    }

    // Swagger schemas are also Fastify/Ajv validation schemas.
    if (fastifyError.validation) {
      return sendError(reply, 400, "Validation failed", ErrorCode.VALIDATION_ERROR, {
        issues: fastifyError.validation.map((issue) => ({
          path: issue.instancePath?.replace(/^\//, "").replaceAll("/", ".") ?? "",
          message: issue.message ?? "Invalid value",
          code: issue.keyword ?? "validation",
        })),
      });
    }

    // Parsers run before a controller, so these errors cannot be handled by Zod.
    if (fastifyError.code === "FST_ERR_CTP_INVALID_JSON_BODY") {
      return sendError(
        reply,
        400,
        "Request body contains invalid JSON",
        ErrorCode.INVALID_JSON_BODY,
      );
    }
    if (fastifyError.code === "FST_ERR_CTP_BODY_TOO_LARGE") {
      return sendError(reply, 413, "Request payload is too large", ErrorCode.PAYLOAD_TOO_LARGE);
    }
    if (fastifyError.code === "FST_ERR_CTP_INVALID_MEDIA_TYPE") {
      return sendError(reply, 415, "Unsupported media type", ErrorCode.UNSUPPORTED_MEDIA_TYPE);
    }
    if (fastifyError.statusCode === 429) {
      return sendError(reply, 429, "Too many requests", ErrorCode.RATE_LIMIT_EXCEEDED, {
        retry_after: reply.getHeader("retry-after") ?? null,
      });
    }

    // Retain any other framework/plugin 4xx status but do not expose details.
    if (
      fastifyError.statusCode &&
      fastifyError.statusCode >= 400 &&
      fastifyError.statusCode < 500
    ) {
      return sendError(reply, fastifyError.statusCode, "Invalid request", ErrorCode.BAD_REQUEST);
    }

    request.log.error({ err: error, requestId: request.id }, "Unhandled request error");
    return sendError(reply, 500, "Internal server error", ErrorCode.INTERNAL_SERVER_ERROR);
  });

  app.setNotFoundHandler((_request, reply) =>
    sendError(reply, 404, "Route not found", ErrorCode.ROUTE_NOT_FOUND),
  );
}
