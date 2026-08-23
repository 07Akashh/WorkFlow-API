import "reflect-metadata";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { AppDataSource } from "../../src/config/database.js";
import { closeEmailQueue } from "../../src/queue/queues/email.queue.js";

const runIntegration = process.env.RUN_INTEGRATION === "true" ? describe : describe.skip;

runIntegration("TaskFlow HTTP API", () => {
  const app = buildApp({ connectInfrastructure: false });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let adminToken = "";
  let secondOrgToken = "";
  let refreshToken = "";
  let projectId = "";
  let taskId = "";
  let memberId = "";
  let jobId = "";

  const request = (method: string, url: string, body?: unknown, token = adminToken) =>
    app.inject({
      method,
      url,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body ? { "content-type": "application/json" } : {}),
      },
      ...(body ? { payload: JSON.stringify(body) } : {}),
    });

  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.dropDatabase();
    await AppDataSource.runMigrations();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await closeEmailQueue();
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  });

  it("covers authentication endpoints through HTTP", async () => {
    const registration = await request(
      "POST",
      "/auth/register",
      {
        name: "API Admin",
        email: `admin-${suffix}@example.test`,
        password: "StrongPassword123!",
        organization_name: "API Org",
        organization_slug: `api-org-${suffix}`,
      },
      "",
    );
    expect(registration.statusCode).toBe(201);
    ({ access_token: adminToken, refresh_token: refreshToken } = registration.json());

    const login = await request(
      "POST",
      "/auth/login",
      {
        email: `admin-${suffix}@example.test`,
        password: "StrongPassword123!",
        organization_slug: `api-org-${suffix}`,
      },
      "",
    );
    expect(login.statusCode).toBe(200);
    expect(login.json().access_token).toEqual(expect.any(String));

    expect((await request("GET", "/auth/me")).statusCode).toBe(200);
    expect((await request("GET", "/auth/admin-check")).statusCode).toBe(200);
    expect(
      (await request("POST", "/auth/refresh", { refresh_token: refreshToken }, "")).statusCode,
    ).toBe(200);
    expect(
      (await request("POST", "/auth/logout", { refresh_token: refreshToken }, "")).statusCode,
    ).toBe(204);

    const secondOrg = await request(
      "POST",
      "/auth/register",
      {
        name: "Other Admin",
        email: `other-${suffix}@example.test`,
        password: "StrongPassword123!",
        organization_name: "Other Org",
        organization_slug: `other-org-${suffix}`,
      },
      "",
    );
    expect(secondOrg.statusCode).toBe(201);
    secondOrgToken = secondOrg.json().access_token;
  });

  it("covers members, projects, tasks, comments, assignments, jobs, and tenant isolation", async () => {
    const members = await request("POST", "/organization/members", {
      name: "API Member",
      email: `member-${suffix}@example.test`,
      password: "StrongPassword123!",
      role: "member",
    });
    expect(members.statusCode).toBe(201);
    memberId = members.json().user_id;
    expect((await request("GET", "/organization/members")).statusCode).toBe(200);
    expect(
      (await request("PATCH", `/organization/members/${memberId}/role`, { role: "org_admin" }))
        .statusCode,
    ).toBe(200);

    const project = await request("POST", "/projects", {
      name: "API Project",
      description: "Created through HTTP",
    });
    expect(project.statusCode).toBe(201);
    projectId = project.json().id;
    expect((await request("GET", "/projects?limit=20")).statusCode).toBe(200);
    expect((await request("GET", `/projects/${projectId}`)).statusCode).toBe(200);
    expect(
      (await request("PATCH", `/projects/${projectId}`, { description: "Updated" })).statusCode,
    ).toBe(200);

    const task = await request("POST", `/projects/${projectId}/tasks`, {
      title: "API Task",
      priority: "high",
      status: "todo",
    });
    expect(task.statusCode).toBe(201);
    taskId = task.json().id;
    expect(
      (await request("GET", `/projects/${projectId}/tasks?status=todo&priority=high`)).statusCode,
    ).toBe(200);
    expect((await request("GET", `/tasks/${taskId}`)).statusCode).toBe(200);
    expect((await request("PATCH", `/tasks/${taskId}`, { status: "in_progress" })).statusCode).toBe(
      200,
    );
    expect((await request("GET", `/projects/${projectId}/dashboard`)).statusCode).toBe(200);

    expect(
      (await request("POST", `/tasks/${taskId}/comments`, { body: "HTTP comment" })).statusCode,
    ).toBe(201);
    expect((await request("GET", `/tasks/${taskId}/comments`)).statusCode).toBe(200);

    const assignment = await request("POST", `/tasks/${taskId}/assignments`, { user_id: memberId });
    expect(assignment.statusCode).toBe(201);
    jobId = assignment.json().notification_job_id;
    expect((await request("GET", `/tasks/${taskId}/assignments`)).statusCode).toBe(200);
    expect((await request("GET", `/jobs/${jobId}`)).statusCode).toBe(200);
    expect((await request("GET", "/jobs?status=pending")).statusCode).toBe(200);

    const crossTenant = await request("GET", `/projects/${projectId}`, undefined, secondOrgToken);
    expect(crossTenant.statusCode).toBe(403);
    expect(crossTenant.json().code).toBe("PROJECT_FORBIDDEN");
    expect((await request("GET", "/projects/not-a-uuid")).statusCode).toBe(400);

    expect((await request("DELETE", `/tasks/${taskId}/assignments/${memberId}`)).statusCode).toBe(
      204,
    );
    expect((await request("DELETE", `/tasks/${taskId}`)).statusCode).toBe(204);
    expect((await request("DELETE", `/projects/${projectId}`)).statusCode).toBe(204);
    expect((await request("DELETE", `/organization/members/${memberId}`)).statusCode).toBe(204);
  });
});
