/**
 * OpenAPI schemas are kept alongside the API rather than inferred from Zod.
 * This makes the contract visible in Swagger while Zod remains the runtime
 * validation source of truth in the controllers.
 */
const uuid = { type: "string", format: "uuid" } as const;
const bearer = [{ bearerAuth: [] }] as const;
const object = (properties: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});
const errorSchema = object(
  {
    error: { type: "string" },
    code: { type: "string" },
    details: { type: "object", additionalProperties: true },
  },
  ["error", "code", "details"],
);
const projectInput = object(
  {
    name: { type: "string", minLength: 2, maxLength: 200 },
    description: { type: ["string", "null"], maxLength: 5000 },
  },
  ["name"],
);
const taskInput = object(
  {
    title: { type: "string", minLength: 2, maxLength: 250 },
    description: { type: ["string", "null"], maxLength: 10000 },
    status: { type: "string", enum: ["todo", "in_progress", "review", "done"], default: "todo" },
    priority: { type: "string", enum: ["low", "medium", "high", "urgent"], default: "medium" },
    due_date: { type: ["string", "null"], format: "date-time" },
  },
  ["title"],
);
const assignmentInput = object({ user_id: uuid }, ["user_id"]);
const commentInput = object({ body: { type: "string", minLength: 1, maxLength: 5000 } }, ["body"]);
const errorResponses = {
  400: {
    description: "Validation error",
    content: { "application/json": { schema: errorSchema } },
  },
  401: {
    description: "Authentication required",
    content: { "application/json": { schema: errorSchema } },
  },
  403: { description: "Forbidden", content: { "application/json": { schema: errorSchema } } },
  404: {
    description: "Resource not found",
    content: { "application/json": { schema: errorSchema } },
  },
  409: { description: "Conflict", content: { "application/json": { schema: errorSchema } } },
  429: {
    description: "Rate limit exceeded",
    content: { "application/json": { schema: errorSchema } },
  },
  500: {
    description: "Internal server error",
    content: { "application/json": { schema: errorSchema } },
  },
} as const;

const response = (description = "Success") => ({ 200: { description } });
const protectedRoute = (tags: string[], summary: string, extra: Record<string, unknown> = {}) => ({
  tags,
  summary,
  security: bearer,
  response: { ...response(), ...errorResponses },
  ...extra,
});

export const swaggerComponents = {
  securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
  schemas: {
    Error: errorSchema,
    ProjectInput: projectInput,
    TaskInput: taskInput,
    AssignmentInput: assignmentInput,
    CommentInput: commentInput,
  },
};

const projectId = object({ projectId: uuid }, ["projectId"]);
const taskId = object({ taskId: uuid }, ["taskId"]);

export const docs = {
  health: {
    tags: ["System"],
    summary: "Liveness check",
    response: { 200: { description: "Service is running" } },
  },
  ready: {
    tags: ["System"],
    summary: "Readiness check for PostgreSQL and Redis",
    response: {
      200: { description: "Dependencies are ready" },
      503: { description: "A dependency is unavailable" },
    },
  },
  register: {
    tags: ["Authentication"],
    summary: "Register a user and organization",
    body: object(
      {
        name: { type: "string", minLength: 2, maxLength: 120 },
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 8, maxLength: 128, format: "password" },
        organization_name: { type: "string", minLength: 2, maxLength: 150 },
        organization_slug: {
          type: "string",
          minLength: 2,
          maxLength: 150,
          pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
        },
      },
      ["name", "email", "password", "organization_name", "organization_slug"],
    ),
    response: { 201: { description: "Registered" }, ...errorResponses },
  },
  login: {
    tags: ["Authentication"],
    summary: "Sign in to an organization",
    body: object(
      {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 1, format: "password" },
        organization_slug: { type: "string", minLength: 1 },
      },
      ["email", "password", "organization_slug"],
    ),
    response: { 200: { description: "Authenticated" }, ...errorResponses },
  },
  refresh: {
    tags: ["Authentication"],
    summary: "Refresh an access token",
    body: object({ refresh_token: { type: "string", minLength: 20 } }, ["refresh_token"]),
    response: { 200: { description: "Token refreshed" }, ...errorResponses },
  },
  logout: {
    tags: ["Authentication"],
    summary: "Revoke a refresh token",
    body: object({ refresh_token: { type: "string", minLength: 20 } }, ["refresh_token"]),
    response: { 204: { description: "Logged out" }, ...errorResponses },
  },
  me: protectedRoute(["Authentication"], "Get current authentication context"),
  adminCheck: protectedRoute(["Authentication"], "Verify organization admin access"),
  createProject: protectedRoute(["Projects"], "Create a project", {
    body: projectInput,
    response: { 201: { description: "Project created" }, ...errorResponses },
  }),
  listProjects: protectedRoute(["Projects"], "List organization projects", {
    querystring: object({
      limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      cursor: { type: "string", minLength: 1 },
    }),
  }),
  project: (summary: string, body?: unknown) =>
    protectedRoute(["Projects"], summary, { params: projectId, ...(body ? { body } : {}) }),
  createTask: protectedRoute(["Tasks"], "Create a task", {
    params: projectId,
    body: taskInput,
    response: { 201: { description: "Task created" }, ...errorResponses },
  }),
  listTasks: protectedRoute(["Tasks"], "List project tasks", {
    params: projectId,
    querystring: object({
      limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      cursor: { type: "string", minLength: 1 },
      status: { type: "string", enum: ["todo", "in_progress", "review", "done"] },
      priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
      assignee_id: uuid,
      due_from: { type: "string", format: "date-time" },
      due_to: { type: "string", format: "date-time" },
    }),
  }),
  task: (summary: string, body?: unknown) =>
    protectedRoute(["Tasks"], summary, { params: taskId, ...(body ? { body } : {}) }),
  dashboard: protectedRoute(["Tasks"], "Get task counts grouped by status", { params: projectId }),
  assignment: (summary: string, body?: unknown, params: unknown = taskId) =>
    protectedRoute(["Assignments"], summary, { params, ...(body ? { body } : {}) }),
  comment: (summary: string, body?: unknown) =>
    protectedRoute(["Comments"], summary, { params: taskId, ...(body ? { body } : {}) }),
  members: (summary: string, body?: unknown, params?: unknown) =>
    protectedRoute(["Members"], summary, {
      ...(params ? { params } : {}),
      ...(body ? { body } : {}),
    }),
  jobs: protectedRoute(["Background jobs"], "List background jobs", {
    querystring: object({
      status: { type: "string", enum: ["pending", "active", "completed", "failed"] },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    }),
  }),
  job: protectedRoute(["Background jobs"], "Get a background job", {
    params: object({ id: uuid }, ["id"]),
  }),
};

export const uuidParams = (additional: Record<string, unknown> = {}) =>
  object(additional, Object.keys(additional));
