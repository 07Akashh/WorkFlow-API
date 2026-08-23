import { type FastifyPluginAsync } from "fastify";

import { authenticate } from "../../common/middleware/authenticate.js";

import { createCommentController, listCommentsController } from "./comment.controller.js";
import { docs } from "../../docs/swagger.js";

export const commentRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/tasks/:taskId/comments",
    {
      schema: docs.comment("Create a comment", {
        type: "object",
        properties: { body: { type: "string", minLength: 1, maxLength: 5000 } },
        required: ["body"],
        additionalProperties: false,
      }),
      preHandler: authenticate,
    },
    createCommentController,
  );

  app.get(
    "/tasks/:taskId/comments",
    {
      schema: docs.comment("List task comments"),
      preHandler: authenticate,
    },
    listCommentsController,
  );
};
