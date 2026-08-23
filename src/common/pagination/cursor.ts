import { z } from "zod";

import { AppError } from "../errors/app-error.js";

import { ErrorCode } from "../errors/error-codes.js";

const cursorSchema = z.object({
  createdAt: z.string().datetime(),

  id: z.string().uuid(),
});

export type CursorPayload = z.infer<typeof cursorSchema>;

export function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");

    const parsed: unknown = JSON.parse(decoded);

    return cursorSchema.parse(parsed);
  } catch {
    throw new AppError({
      message: "Invalid pagination cursor",

      code: ErrorCode.BAD_REQUEST,

      statusCode: 400,

      details: {
        field: "cursor",
      },
    });
  }
}
