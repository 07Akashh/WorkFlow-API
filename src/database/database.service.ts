import { AppDataSource } from "../config/database.js";

export async function connectDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    return;
  }

  await AppDataSource.initialize();
}

export async function disconnectDatabase(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    return;
  }

  await AppDataSource.destroy();
}

export async function isDatabaseHealthy(): Promise<boolean> {
  if (!AppDataSource.isInitialized) {
    return false;
  }

  try {
    await AppDataSource.query("SELECT 1");

    return true;
  } catch {
    return false;
  }
}
