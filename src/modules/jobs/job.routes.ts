import { FastifyInstance } from "fastify";

import { listJobs, getJob } from "./job.service.js";
import { authenticate } from "../../common/middleware/authenticate.js";
import { authorizeRoles } from "../../common/middleware/authorize-role.js";
import { OrgRole } from "../../database/enums/org-role.enum.js";
import { docs } from "../../docs/swagger.js";

export function jobRoutes(app: FastifyInstance) {
  app.get(
    "/jobs",
    { preHandler: [authenticate, authorizeRoles(OrgRole.ORG_ADMIN)], schema: docs.jobs },
    async (request) => {
      const { status, limit } = request.query as {
        status?: string;
        limit?: number;
      };

      return {
        data: await listJobs({
          status,
          limit: Number(limit) || 20,
          organizationId: request.auth.organizationId,
        }),
      };
    },
  );

  app.get(
    "/jobs/:id",
    { preHandler: [authenticate, authorizeRoles(OrgRole.ORG_ADMIN)], schema: docs.job },
    (request) => {
      const { id } = request.params as {
        id: string;
      };

      return getJob(id, request.auth.organizationId);
    },
  );
}
