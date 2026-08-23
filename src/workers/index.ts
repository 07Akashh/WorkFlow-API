import "reflect-metadata";

import { startEmailWorker, stopEmailWorker } from "./email.worker.js";

let stopping = false;

async function shutdown(signal: string): Promise<void> {
  if (stopping) return;
  stopping = true;
  console.info(`TaskFlow worker shutting down (${signal})`);
  await stopEmailWorker();
}

function handleShutdown(signal: string): void {
  void shutdown(signal).catch((error: unknown) => {
    console.error("TaskFlow worker shutdown failed", error);
    process.exitCode = 1;
  });
}

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

startEmailWorker()
  .then(() => console.info("TaskFlow email worker is ready; waiting jobs will be processed."))
  .catch((error) => {
    console.error("TaskFlow worker failed to start", error);
    process.exitCode = 1;
  });
