# Submission demo checklist

Use this checklist when recording the requested short demo video.

1. Start all four services with Docker Compose.
2. Open Swagger at `/docs` and show registration/login.
3. Create a project and task, then assign an organization member.
4. Show the `notification_job_id` and query it through `GET /jobs/:id`.
5. Stop the worker, create another assignment, and show that the job remains pending; restart the worker and show completion.
6. Demonstrate a cross-tenant project request returning `403`.
7. Run `npm test` and `npm run test:integration`.

Before submission, include the public repository link, Swagger URL (or local setup steps), Postman collection, and this architecture documentation.
