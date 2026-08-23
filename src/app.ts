import Fastify, { type FastifyInstance } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import rateLimit from "@fastify/rate-limit";

import { env } from "./config/env.js";
import { isRedisHealthy } from "./config/redis.js";
import { registerErrorHandler } from "./common/errors/error-handler.js";
import { isDatabaseHealthy } from "./database/database.service.js";
import { registerInfrastructureLifecycle } from "./infrastructure/lifecycle.js";

import { authRoutes } from "./modules/auth/auth.route.js";
import { memberRoutes } from "./modules/members/member.routes.js";
import { projectRoutes } from "./modules/projects/project.routes.js";
import { taskRoutes } from "./modules/tasks/task.routes.js";
import { assignmentRoutes } from "./modules/assignments/assignment.routes.js";
import { commentRoutes } from "./modules/comments/comment.routes.js";
import { jobRoutes } from "./modules/jobs/job.routes.js";
import { docs, swaggerComponents } from "./docs/swagger.js";

export interface BuildAppOptions {
  connectInfrastructure?: boolean;
}

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,

      transport:
        env.NODE_ENV === "development"
          ? {
              target: "pino-pretty",

              options: {
                translateTime: "SYS:standard",

                ignore: "pid,hostname",
              },
            }
          : undefined,
    },
  });

  registerErrorHandler(app);

  // Swagger must be registered before routes so it can collect every contract.
  app.register(fastifySwagger, {
    openapi: {
      openapi: "3.1.0",
      info: {
        title: "TaskFlow API",
        description: "Multi-tenant project-management API",
        version: "1.0.0",
      },
      servers: [{ url: "http://localhost:3000", description: "Local development" }],
      components: swaggerComponents as never,
    },
  });
  app.register(fastifySwaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: true },
  });

  const connectInfrastructure = options.connectInfrastructure ?? true;

  if (connectInfrastructure) {
    registerInfrastructureLifecycle(app);
  }

  app.register(rateLimit, {
    global: false,
  });
  app.addHook("onRequest", async (request, reply) => {
    reply.header("x-request-id", request.id);
  });

  app.register(authRoutes, {
    prefix: "/auth",
  });
  app.register(memberRoutes, {
    prefix: "/organization",
  });
  app.register(projectRoutes, {
    prefix: "/projects",
  });
  app.register(taskRoutes);
  app.register(assignmentRoutes);
  app.register(commentRoutes);
  app.register(jobRoutes);

  app.get("/health", { schema: docs.health }, async () => {
    return {
      status: "ok",
      service: "taskflow-api",
    };
  });

  app.get("/ready", { schema: docs.ready }, async (_request, reply) => {
    const [databaseHealthy, redisHealthy] = await Promise.all([
      isDatabaseHealthy(),
      isRedisHealthy(),
    ]);

    const ready = databaseHealthy && redisHealthy;

    return reply.status(ready ? 200 : 503).send({
      status: ready ? "ready" : "not_ready",

      checks: {
        database: databaseHealthy ? "ok" : "failed",

        redis: redisHealthy ? "ok" : "failed",
      },
    });
  });

  return app;
}
