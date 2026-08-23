import "reflect-metadata";

import { buildApp } from "./app.js";

import { env } from "./config/env.js";

const app = buildApp();

let shuttingDown = false;

async function start(): Promise<void> {
  try {
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    app.log.info(
      {
        port: env.PORT,
        environment: env.NODE_ENV,
      },
      "TaskFlow API started",
    );
  } catch (error) {
    app.log.error(error, "Failed to start TaskFlow API");

    process.exitCode = 1;
  }
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  app.log.info(
    {
      signal,
    },
    "TaskFlow API shutting down",
  );

  try {
    await app.close();

    app.log.info("TaskFlow API stopped");
  } catch (error) {
    app.log.error(error, "Error during shutdown");

    process.exitCode = 1;
  }
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

void start();
