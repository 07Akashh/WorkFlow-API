import { type FastifyPluginAsync } from "fastify";

import {
  loginController,
  logoutController,
  refreshController,
  registerController,
  meController,
  adminCheckController,
} from "./auth.controller.js";

import { authenticate } from "../../common/middleware/authenticate.js";
import { authorizeRoles } from "../../common/middleware/authorize-role.js";
import { OrgRole } from "../../database/enums/org-role.enum.js";
import { docs } from "../../docs/swagger.js";

const authRateLimit = {
  max: 10,
  timeWindow: "1 minute",
};

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post(
    "/register",
    {
      schema: docs.register,
      config: {
        rateLimit: authRateLimit,
      },
    },
    registerController,
  );

  app.post(
    "/login",
    {
      schema: docs.login,
      config: {
        rateLimit: authRateLimit,
      },
    },
    loginController,
  );

  app.post(
    "/refresh",
    {
      schema: docs.refresh,
      config: {
        rateLimit: authRateLimit,
      },
    },
    refreshController,
  );

  app.post(
    "/logout",
    {
      schema: docs.logout,
      config: {
        rateLimit: authRateLimit,
      },
    },
    logoutController,
  );
  app.get(
    "/me",
    {
      schema: docs.me,
      preHandler: authenticate,
    },
    meController,
  );
  app.get(
    "/admin-check",
    {
      schema: docs.adminCheck,
      preHandler: [authenticate, authorizeRoles(OrgRole.ORG_ADMIN)],
    },
    adminCheckController,
  );
};
