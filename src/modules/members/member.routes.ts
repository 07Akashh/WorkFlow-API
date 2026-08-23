import { type FastifyPluginAsync } from "fastify";

import { authenticate } from "../../common/middleware/authenticate.js";

import { authorizeRoles } from "../../common/middleware/authorize-role.js";

import { OrgRole } from "../../database/enums/org-role.enum.js";

import {
  addMemberController,
  listMembersController,
  removeMemberController,
  updateMemberRoleController,
} from "./member.controller.js";
import { docs, uuidParams } from "../../docs/swagger.js";

export const memberRoutes: FastifyPluginAsync = async (app) => {
  app.get(
    "/members",
    {
      schema: docs.members("List organization members"),
      preHandler: authenticate,
    },
    listMembersController,
  );

  app.post(
    "/members",
    {
      schema: docs.members("Add an organization member", {
        type: "object",
        properties: {
          name: { type: "string", minLength: 2, maxLength: 120 },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8, maxLength: 128, format: "password" },
          role: { type: "string", enum: ["org_admin", "member"], default: "member" },
        },
        required: ["email"],
        additionalProperties: false,
      }),
      preHandler: [authenticate, authorizeRoles(OrgRole.ORG_ADMIN)],
    },
    addMemberController,
  );

  app.patch(
    "/members/:userId/role",
    {
      schema: docs.members(
        "Change a member role",
        {
          type: "object",
          properties: { role: { type: "string", enum: ["org_admin", "member"] } },
          required: ["role"],
          additionalProperties: false,
        },
        uuidParams({ userId: { type: "string", format: "uuid" } }),
      ),
      preHandler: [authenticate, authorizeRoles(OrgRole.ORG_ADMIN)],
    },
    updateMemberRoleController,
  );

  app.delete(
    "/members/:userId",
    {
      schema: docs.members(
        "Remove an organization member",
        undefined,
        uuidParams({ userId: { type: "string", format: "uuid" } }),
      ),
      preHandler: [authenticate, authorizeRoles(OrgRole.ORG_ADMIN)],
    },
    removeMemberController,
  );
};
