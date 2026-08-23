import { type ConnectionOptions } from "bullmq";

import { env } from "./env.js";

function parseRedisUrl(maxRetriesPerRequest: number | null): ConnectionOptions {
  const url = new URL(env.REDIS_URL);

  const database = url.pathname && url.pathname !== "/" ? Number(url.pathname.slice(1)) : 0;

  return {
    host: url.hostname,

    port: Number(url.port || 6379),

    username: url.username || undefined,

    password: url.password || undefined,

    db: Number.isNaN(database) ? 0 : database,

    maxRetriesPerRequest,

    connectTimeout: 2_000,

    enableOfflineQueue: false,

    ...(url.protocol === "rediss:"
      ? {
          tls: {},
        }
      : {}),
  };
}

export const bullMqProducerConnection = parseRedisUrl(1);

export const bullMqWorkerConnection = parseRedisUrl(null);
