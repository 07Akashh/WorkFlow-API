import { type ErrorCode } from "./error-codes.js";

export class AppError extends Error {
  readonly statusCode: number;

  readonly code: ErrorCode;

  readonly details: Record<string, unknown>;

  constructor({
    message,
    code,
    statusCode,
    details = {},
  }: {
    message: string;
    code: ErrorCode;
    statusCode: number;
    details?: Record<string, unknown>;
  }) {
    super(message);

    this.name = "AppError";

    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
