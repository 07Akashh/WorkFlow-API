# TaskFlow backend

TaskFlow is a multi-tenant Fastify API for organizations, projects, tasks, assignments, comments, and asynchronous assignment-email notifications.

## Run locally

1. Copy `.env.example` to `.env` and replace `JWT_ACCESS_SECRET` with a secret of at least 32 characters.
2. Start PostgreSQL and Redis with `docker compose up postgres redis` (or use your own services).
3. Install dependencies, run migrations and seed data: `npm install`, `npm run migration:run`, `npm run seed`.
4. Start the API with `npm run dev` and the worker separately with `npm run worker`.

`docker compose up --build` starts API, worker, PostgreSQL, and Redis together. Swagger UI is available at `http://localhost:3000/docs`; the raw OpenAPI document is at `/documentation/json`.

## Email configuration

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `EMAIL_FROM` to use an SMTP provider. With no `SMTP_HOST`, development and tests use Nodemailer's JSON transport, so no real emails are sent. Production requires `SMTP_HOST`.

## Queue consistency and recovery

Assignments use a **transactional rollback strategy**. The assignment and its `background_jobs` record are created in one PostgreSQL transaction; BullMQ enqueueing is attempted before that transaction commits. If Redis cannot accept the job, the transaction rolls back and the API returns `503`, so no assignment is reported without its notification job.

Redis retains accepted BullMQ jobs when the worker is offline. They remain in `waiting` and begin processing when a worker starts again. The worker waits for PostgreSQL and SMTP readiness before subscribing. A graceful shutdown closes the worker so active jobs are not needlessly marked stalled; after an ungraceful worker loss, BullMQ recovers stalled jobs. Each job has one attempt plus three retries with exponential 1s, 2s, and 4s delays. On the final failure, the job is recorded as `failed` and copied to `taskflow-email-dlq` for inspection.

## Architecture

Routes call controllers, which validate Zod input and delegate to services. Services enforce tenant scope and business rules; repositories contain persistence operations. PostgreSQL holds application data and durable job metadata. Redis/BullMQ handles asynchronous delivery. The worker is an independent process, which prevents SMTP latency from blocking assignment API responses.

## Validation and tests

Swagger documents every endpoint's body, query and path validation constraints, bearer authentication, rate limits, and standard errors. Runtime validation remains in Zod. Run `npm test` for unit tests, `npm run typecheck` for TypeScript validation, and `npm run build` for the production build.

For the complete architecture, API, integration-test setup, and recording checklist, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/API.md](docs/API.md), [docs/TESTING.md](docs/TESTING.md), and [docs/DEMO_CHECKLIST.md](docs/DEMO_CHECKLIST.md).
