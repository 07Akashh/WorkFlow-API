import { type AuthContext } from "../modules/auth/auth.types.js";

declare module "fastify" {
  interface FastifyRequest {
    auth: AuthContext;
  }
}
