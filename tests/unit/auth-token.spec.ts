import { describe, expect, it } from "vitest";

import { OrgRole } from "../../src/database/enums/org-role.enum.js";

import { createAccessToken, verifyAccessToken } from "../../src/modules/auth/auth.token.js";

describe("access token", () => {
  it("creates and verifies tenant claims", () => {
    const payload = {
      userId: "550e8400-e29b-41d4-a716-446655440000",

      organizationId: "550e8400-e29b-41d4-a716-446655440001",

      role: OrgRole.ORG_ADMIN,
    };

    const token = createAccessToken(payload);

    const decoded = verifyAccessToken(token);

    expect(decoded).toEqual(payload);
  });

  it("rejects invalid tokens", () => {
    expect(() => verifyAccessToken("invalid-token")).toThrow();
  });
});
