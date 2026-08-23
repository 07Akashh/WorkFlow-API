import { type FastifyInstance } from "fastify";
import { connectRedis, disconnectRedis } from "../config/redis.js";
import { connectDatabase, disconnectDatabase } from "../database/database.service.js";
import { closeEmailQueue, connectEmailQueue } from "../queue/queues/email.queue.js";
import { closeEmailDlq } from "../queue/queues/email-dlq.queue.js";

export function registerInfrastructureLifecycle(app: FastifyInstance): void {
  app.addHook("onReady", async () => {
    await connectDatabase();

    app.log.info("PostgreSQL connected");

    await connectRedis();

    app.log.info("Redis connected");

    await connectEmailQueue();

    app.log.info("BullMQ email queue connected");
  });

  app.addHook("onClose", async () => {
    await Promise.allSettled([
      closeEmailQueue(),
      closeEmailDlq(),
      disconnectRedis(),
      disconnectDatabase(),
    ]);

    app.log.info("Infrastructure connections closed");
  });
}
