import "reflect-metadata";
import "dotenv/config";

import { DataSource } from "typeorm";

import {
  BackgroundJob,
  Comment,
  Organization,
  OrgMember,
  Project,
  RefreshToken,
  Task,
  TaskAssignment,
  User,
} from "../database/entities/index.js";
import { env } from "./env.js";

export const AppDataSource = new DataSource({
  type: "postgres",

  url: env.DATABASE_URL,

  entities: [
    User,
    Organization,
    OrgMember,
    Project,
    Task,
    TaskAssignment,
    Comment,
    RefreshToken,
    BackgroundJob,
  ],

  migrations: [
    env.NODE_ENV === "production"
      ? "dist/database/migrations/*.js"
      : "src/database/migrations/*.ts",
  ],

  synchronize: false,

  logging: env.NODE_ENV === "development",
});
