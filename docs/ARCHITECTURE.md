# TaskFlow architecture

## Components

| Component      | Responsibility                                                              |
| -------------- | --------------------------------------------------------------------------- |
| Fastify API    | HTTP endpoints, authentication, validation, tenant enforcement, Swagger     |
| PostgreSQL     | Durable application data, refresh-token revocation, background-job metadata |
| Redis + BullMQ | Durable waiting queue, retries, exponential backoff, dead-letter queue      |
| Worker         | Sends assignment notification emails independently of API requests          |

## Request flow

1. The API authenticates a bearer token and establishes a user/organization context.
2. Controllers validate input with Zod, and services scope access to that organization.
3. Services use repositories to persist application data in PostgreSQL.
4. Assignment creation creates a durable `background_jobs` record and enqueues a BullMQ email job before the database transaction commits.
5. The worker processes the job asynchronously and records `pending`, `active`, `completed`, or `failed` status.

## Tenant boundary

The organization is derived exclusively from signed JWT claims. `org_id` is never accepted from a client request. Resource ownership is checked before reads and writes; resources in another tenant return `403` without returning their data.

## Reliability decisions

The queue producer can enqueue without a worker online. Redis stores accepted jobs in `waiting`; a restarted worker continues processing them. Jobs receive an initial attempt plus three retries with 1/2/4-second exponential delays. Final failures are persisted and copied to the email dead-letter queue.

The assignment transaction is rolled back when Redis cannot accept the notification job, avoiding a successful assignment that lacks a notification record.
