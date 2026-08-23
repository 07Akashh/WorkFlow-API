import { Redis } from "ioredis";
import { env } from "./env.js";

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,

  maxRetriesPerRequest: 1,

  enableReadyCheck: true,
});

// ioredis emits connection failures as EventEmitter errors. Handling them here
// keeps transient Redis outages observable without creating an unhandled error.
redis.on("error", (error) => {
  console.error("Redis connection error", error.message);
});

export async function connectRedis(): Promise<void> {
  if (redis.status === "ready") {
    return;
  }

  if (redis.status === "wait") {
    await redis.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redis.status === "end" || redis.status === "wait") {
    return;
  }

  await redis.quit();
}

export async function isRedisHealthy(): Promise<boolean> {
  try {
    if (redis.status !== "ready") {
      return false;
    }

    const response = await redis.ping();

    return response === "PONG";
  } catch {
    return false;
  }
}
