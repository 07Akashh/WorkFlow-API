import { afterEach, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";

describe("TaskFlow application", () => {
  const apps: ReturnType<typeof buildApp>[] = [];

  afterEach(async () => {
    await Promise.all(apps.map((app) => app.close()));

    apps.length = 0;
  });

  it("returns the API health status", async () => {
    const app = buildApp({
      connectInfrastructure: false,
    });

    apps.push(app);

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);

    expect(response.json()).toEqual({
      status: "ok",
      service: "taskflow-api",
    });
  });

  it("returns a safe 400 error for malformed JSON instead of a 500", async () => {
    const app = buildApp({ connectInfrastructure: false });
    apps.push(app);

    const response = await app.inject({
      method: "POST",
      url: "/auth/login",
      headers: { "content-type": "application/json" },
      payload: '{"email":',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: "Request body contains invalid JSON",
      code: "INVALID_JSON_BODY",
      details: {},
    });
  });

  it("returns a consistent 404 error for an unknown route", async () => {
    const app = buildApp({ connectInfrastructure: false });
    apps.push(app);

    const response = await app.inject({ method: "GET", url: "/does-not-exist" });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: "Route not found",
      code: "ROUTE_NOT_FOUND",
      details: {},
    });
  });
});
