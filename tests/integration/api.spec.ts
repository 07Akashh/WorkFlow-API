import "reflect-metadata";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../src/app.js";
import { AppDataSource } from "../../src/config/database.js";
import { closeEmailQueue } from "../../src/queue/queues/email.queue.js";

const integration = process.env.RUN_INTEGRATION === "true" ? describe : describe.skip;
const password = process.env.TEST_USER_PASSWORD ?? process.env.SEED_USER_PASSWORD;

if (process.env.RUN_INTEGRATION === "true" && !password) {
  throw new Error("TEST_USER_PASSWORD or SEED_USER_PASSWORD must be set before running API tests");
}

type AuthUser = {
  email: string;
  slug: string;
  accessToken: string;
  refreshToken: string;
  userId: string;
};

integration("TaskFlow complete HTTP API workflow", () => {
  const app = buildApp({ connectInfrastructure: false });
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const users = {} as Record<"adminA" | "memberA" | "adminB" | "memberB", AuthUser>;
  let projectId = "";
  let taskId = "";
  let jobId = "";

  const api = (method: string, url: string, body?: unknown, token?: string) =>
    app.inject({
      method,
      url,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { payload: JSON.stringify(body) }),
    });

  const register = async (name: string, email: string, slug: string): Promise<AuthUser> => {
    const response = await api("POST", "/auth/register", {
      name,
      email,
      password,
      organization_name: `${name} Organization`,
      organization_slug: slug,
    });
    expect(response.statusCode).toBe(201);
    const body = response.json();
    return {
      email,
      slug,
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      userId: body.user.id,
    };
  };

  const login = async (email: string, slug: string): Promise<AuthUser> => {
    const response = await api("POST", "/auth/login", { email, password, organization_slug: slug });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    return {
      email,
      slug,
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      userId: body.user.id,
    };
  };

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

  it("authenticates and stores two admins and two members through the API", async () => {
    users.adminA = await register("Admin A", `admin-a-${suffix}@test.local`, `org-a-${suffix}`);
    users.adminB = await register("Admin B", `admin-b-${suffix}@test.local`, `org-b-${suffix}`);

    const memberAEmail = `member-a-${suffix}@test.local`;
    const memberBEmail = `member-b-${suffix}@test.local`;
    expect(
      (
        await api(
          "POST",
          "/organization/members",
          { name: "Member A", email: memberAEmail, password, role: "member" },
          users.adminA.accessToken,
        )
      ).statusCode,
    ).toBe(201);
    expect(
      (
        await api(
          "POST",
          "/organization/members",
          { name: "Member B", email: memberBEmail, password, role: "member" },
          users.adminB.accessToken,
        )
      ).statusCode,
    ).toBe(201);

    users.adminA = await login(users.adminA.email, users.adminA.slug);
    users.adminB = await login(users.adminB.email, users.adminB.slug);
    users.memberA = await login(memberAEmail, users.adminA.slug);
    users.memberB = await login(memberBEmail, users.adminB.slug);

    expect((await api("GET", "/auth/me", undefined, users.memberA.accessToken)).statusCode).toBe(
      200,
    );
    expect(
      (await api("GET", "/auth/admin-check", undefined, users.adminA.accessToken)).statusCode,
    ).toBe(200);
    expect(
      (await api("GET", "/auth/admin-check", undefined, users.memberA.accessToken)).statusCode,
    ).toBe(403);
    expect((await api("GET", "/auth/me")).statusCode).toBe(401);
    expect(
      (
        await api("POST", "/auth/login", {
          email: users.adminA.email,
          password: "wrong",
          organization_slug: users.adminA.slug,
        })
      ).statusCode,
    ).toBe(401);

    const refreshed = await api("POST", "/auth/refresh", {
      refresh_token: users.memberB.refreshToken,
    });
    expect(refreshed.statusCode).toBe(200);
    users.memberB.refreshToken = refreshed.json().refresh_token;
    expect(
      (await api("POST", "/auth/logout", { refresh_token: users.memberB.refreshToken })).statusCode,
    ).toBe(204);
    expect(
      (await api("POST", "/auth/refresh", { refresh_token: users.memberB.refreshToken }))
        .statusCode,
    ).toBe(401);
  });

  it("covers members, projects, tasks, comments, assignments, and jobs", async () => {
    expect(
      (await api("GET", "/organization/members", undefined, users.adminA.accessToken)).statusCode,
    ).toBe(200);
    const temporary = await api(
      "POST",
      "/organization/members",
      { name: "Temporary", email: `temporary-${suffix}@test.local`, password, role: "member" },
      users.adminA.accessToken,
    );
    expect(temporary.statusCode).toBe(201);
    expect(
      (
        await api(
          "PATCH",
          `/organization/members/${temporary.json().user_id}/role`,
          { role: "org_admin" },
          users.adminA.accessToken,
        )
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await api(
          "DELETE",
          `/organization/members/${temporary.json().user_id}`,
          undefined,
          users.adminA.accessToken,
        )
      ).statusCode,
    ).toBe(204);

    const project = await api(
      "POST",
      "/projects",
      { name: "HTTP workflow project", description: "Created by API test" },
      users.adminA.accessToken,
    );
    expect(project.statusCode).toBe(201);
    projectId = project.json().id;
    expect(
      (await api("GET", "/projects?limit=20", undefined, users.memberA.accessToken)).statusCode,
    ).toBe(200);
    expect(
      (await api("GET", `/projects/${projectId}`, undefined, users.adminA.accessToken)).statusCode,
    ).toBe(200);
    expect(
      (
        await api(
          "PATCH",
          `/projects/${projectId}`,
          { description: "Updated" },
          users.memberA.accessToken,
        )
      ).statusCode,
    ).toBe(200);
    expect(
      (await api("GET", `/projects/${projectId}`, undefined, users.adminB.accessToken)).statusCode,
    ).toBe(403);
    expect(
      (await api("DELETE", `/projects/${projectId}`, undefined, users.memberA.accessToken))
        .statusCode,
    ).toBe(403);

    const task = await api(
      "POST",
      `/projects/${projectId}/tasks`,
      { title: "HTTP workflow task", status: "todo", priority: "high" },
      users.memberA.accessToken,
    );
    expect(task.statusCode).toBe(201);
    taskId = task.json().id;
    expect(
      (
        await api(
          "GET",
          `/projects/${projectId}/tasks?status=todo&priority=high`,
          undefined,
          users.adminA.accessToken,
        )
      ).statusCode,
    ).toBe(200);
    expect(
      (await api("GET", `/tasks/${taskId}`, undefined, users.memberA.accessToken)).statusCode,
    ).toBe(200);
    expect(
      (await api("PATCH", `/tasks/${taskId}`, { status: "review" }, users.adminA.accessToken))
        .statusCode,
    ).toBe(200);
    expect(
      (await api("GET", `/projects/${projectId}/dashboard`, undefined, users.adminA.accessToken))
        .statusCode,
    ).toBe(200);
    expect(
      (await api("GET", `/tasks/${taskId}`, undefined, users.adminB.accessToken)).statusCode,
    ).toBe(403);
    expect(
      (await api("GET", "/tasks/not-a-uuid", undefined, users.adminA.accessToken)).statusCode,
    ).toBe(400);

    expect(
      (
        await api(
          "POST",
          `/tasks/${taskId}/comments`,
          { body: "API comment" },
          users.memberA.accessToken,
        )
      ).statusCode,
    ).toBe(201);
    expect(
      (await api("GET", `/tasks/${taskId}/comments`, undefined, users.adminA.accessToken))
        .statusCode,
    ).toBe(200);

    const assignment = await api(
      "POST",
      `/tasks/${taskId}/assignments`,
      { user_id: users.memberA.userId },
      users.adminA.accessToken,
    );
    expect(assignment.statusCode).toBe(201);
    jobId = assignment.json().notification_job_id;
    expect(
      (
        await api(
          "POST",
          `/tasks/${taskId}/assignments`,
          { user_id: users.memberB.userId },
          users.adminA.accessToken,
        )
      ).statusCode,
    ).toBe(400);
    expect(
      (await api("GET", `/tasks/${taskId}/assignments`, undefined, users.adminA.accessToken))
        .statusCode,
    ).toBe(200);
    expect(
      (await api("GET", `/jobs/${jobId}`, undefined, users.adminA.accessToken)).statusCode,
    ).toBe(200);
    expect(
      (await api("GET", "/jobs?status=pending", undefined, users.adminA.accessToken)).statusCode,
    ).toBe(200);
    expect(
      (await api("GET", `/jobs/${jobId}`, undefined, users.adminB.accessToken)).statusCode,
    ).toBe(404);

    expect(
      (
        await api(
          "DELETE",
          `/tasks/${taskId}/assignments/${users.memberA.userId}`,
          undefined,
          users.adminA.accessToken,
        )
      ).statusCode,
    ).toBe(204);
    expect(
      (await api("DELETE", `/tasks/${taskId}`, undefined, users.adminA.accessToken)).statusCode,
    ).toBe(204);
    expect(
      (await api("DELETE", `/projects/${projectId}`, undefined, users.adminA.accessToken))
        .statusCode,
    ).toBe(204);
  });
});
