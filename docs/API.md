# API guide

Interactive API documentation is served locally at `GET /docs`. The OpenAPI document is available at `GET /documentation/json`.

All protected endpoints require `Authorization: Bearer <access_token>`. Authentication endpoints are rate limited to 10 requests/minute/IP.

| Area           | Endpoints                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Authentication | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`; `GET /auth/me`, `/auth/admin-check`        |
| Members        | `GET, POST /organization/members`; `PATCH, DELETE /organization/members/:userId`                                  |
| Projects       | `POST, GET /projects`; `GET, PATCH, DELETE /projects/:projectId`                                                  |
| Tasks          | `POST, GET /projects/:projectId/tasks`; `GET /projects/:projectId/dashboard`; `GET, PATCH, DELETE /tasks/:taskId` |
| Assignments    | `POST, GET /tasks/:taskId/assignments`; `DELETE /tasks/:taskId/assignments/:userId`                               |
| Comments       | `POST, GET /tasks/:taskId/comments`                                                                               |
| Jobs           | `GET /jobs`, `GET /jobs/:id` (organization admin)                                                                 |

Errors always use `{ "error": string, "code": string, "details": object }`. Swagger lists each request field’s allowed type, length, enum values, and required status.
