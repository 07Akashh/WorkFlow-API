import { type FastifyPluginAsync } from "fastify";

import { authenticate } from "../../common/middleware/authenticate.js";

import {
  assignUserController,
  listAssignmentsController,
  unassignUserController,
} from "./assignment.controller.js";
import { docs, uuidParams } from "../../docs/swagger.js";

export const assignmentRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/tasks/:taskId/assignments",
    {
      schema: docs.assignment("Assign a user and enqueue an email", {
        type: "object",
        properties: { user_id: { type: "string", format: "uuid" } },
        required: ["user_id"],
        additionalProperties: false,
      }),
      preHandler: authenticate,
    },
    assignUserController,
  );

  app.get(
    "/tasks/:taskId/assignments",
    {
      schema: docs.assignment("List task assignments"),
      preHandler: authenticate,
    },
    listAssignmentsController,
  );

  app.delete(
    "/tasks/:taskId/assignments/:userId",
    {
      schema: docs.assignment(
        "Unassign a user",
        undefined,
        uuidParams({
          taskId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
        }),
      ),
      preHandler: authenticate,
    },
    unassignUserController,
  );
};
