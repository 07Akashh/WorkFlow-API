import { AppError } from "../errors/app-error.js";

import { ErrorCode } from "../errors/error-codes.js";

export function assertTenantAccess({
  resourceOrganizationId,
  authenticatedOrganizationId,
  resourceName = "Resource",
}: {
  resourceOrganizationId: string;
  authenticatedOrganizationId: string;
  resourceName?: string;
}): void {
  if (resourceOrganizationId !== authenticatedOrganizationId) {
    throw new AppError({
      message: "Access to this resource is forbidden",

      code: ErrorCode.FORBIDDEN,

      statusCode: 403,

      details: {
        resource: resourceName,
      },
    });
  }
}
