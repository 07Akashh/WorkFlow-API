import { describe, expect, it } from "vitest";

import { AppError } from "../../src/common/errors/app-error.js";

import { decodeCursor, encodeCursor } from "../../src/common/pagination/cursor.js";

describe("cursor pagination", () => {
  it("encodes and decodes a cursor", () => {
    const payload = {
      createdAt: "2026-08-22T10:00:00.000Z",

      id: "550e8400-e29b-41d4-a716-446655440000",
    };

    const cursor = encodeCursor(payload);

    expect(decodeCursor(cursor)).toEqual(payload);
  });

  it("rejects an invalid cursor", () => {
    expect(() => decodeCursor("invalid-cursor")).toThrow(AppError);
  });
});
