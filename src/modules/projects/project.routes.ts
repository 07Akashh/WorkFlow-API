import { type FastifyPluginAsync } from "fastify";

import { authenticate } from "../../common/middleware/authenticate.js";

import { authorizeRoles } from "../../common/middleware/authorize-role.js";

import { OrgRole } from "../../database/enums/org-role.enum.js";

import {
  createProjectController,
  deleteProjectController,
  getProjectController,
  listProjectsController,
  updateProjectController,
} from "./project.controller.js";
import { docs } from "../../docs/swagger.js";

export const projectRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/",
    {
      schema: docs.createProject,
      preHandler: authenticate,
    },
    createProjectController,
  );

  app.get(
    "/",
    {
      schema: docs.listProjects,
      preHandler: authenticate,
    },
    listProjectsController,
  );

  app.get(
    "/:projectId",
    {
      schema: docs.project("Get a project"),
      preHandler: authenticate,
    },
    getProjectController,
  );

  app.patch(
    "/:projectId",
    {
      schema: docs.project("Update a project", {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 200 },
          description: { type: ["string", "null"], maxLength: 5000 },
        },
        minProperties: 1,
        additionalProperties: false,
      }),
      preHandler: authenticate,
    },
    updateProjectController,
  );

  app.delete(
    "/:projectId",
    {
      schema: docs.project("Delete a project"),
      preHandler: [authenticate, authorizeRoles(OrgRole.ORG_ADMIN)],
    },
    deleteProjectController,
  );
};
