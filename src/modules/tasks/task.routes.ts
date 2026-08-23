import { type FastifyPluginAsync } from "fastify";

import { authenticate } from "../../common/middleware/authenticate.js";

import {
  createTaskController,
  deleteTaskController,
  getTaskController,
  listTasksController,
  projectDashboardController,
  updateTaskController,
} from "./task.controller.js";
import { docs } from "../../docs/swagger.js";

export const taskRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/projects/:projectId/tasks",
    {
      schema: docs.createTask,
      preHandler: authenticate,
    },
    createTaskController,
  );

  app.get(
    "/projects/:projectId/tasks",
    {
      schema: docs.listTasks,
      preHandler: authenticate,
    },
    listTasksController,
  );

  app.get(
    "/projects/:projectId/dashboard",
    {
      schema: docs.dashboard,
      preHandler: authenticate,
    },
    projectDashboardController,
  );

  app.get(
    "/tasks/:taskId",
    {
      schema: docs.task("Get a task"),
      preHandler: authenticate,
    },
    getTaskController,
  );

  app.patch(
    "/tasks/:taskId",
    {
      schema: docs.task("Update a task", {
        type: "object",
        properties: {
          title: { type: "string", minLength: 2, maxLength: 250 },
          description: { type: ["string", "null"], maxLength: 10000 },
          status: { type: "string", enum: ["todo", "in_progress", "review", "done"] },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
          due_date: { type: ["string", "null"], format: "date-time" },
        },
        minProperties: 1,
        additionalProperties: false,
      }),
      preHandler: authenticate,
    },
    updateTaskController,
  );

  app.delete(
    "/tasks/:taskId",
    {
      schema: docs.task("Delete a task"),
      preHandler: authenticate,
    },
    deleteTaskController,
  );
};
