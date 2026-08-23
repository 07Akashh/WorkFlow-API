import { type OrgRole } from "../../database/enums/org-role.enum.js";

export interface AuthContext {
  userId: string;

  organizationId: string;

  role: OrgRole;
}
