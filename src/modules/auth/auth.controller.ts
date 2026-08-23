import { type FastifyReply, type FastifyRequest } from "fastify";

import { validate } from "../../common/validation/validate.js";

import { loginSchema, logoutSchema, refreshSchema, registerSchema } from "./auth.schema.js";

import * as authService from "./auth.service.js";

export async function registerController(request: FastifyRequest, reply: FastifyReply) {
  const input = validate(registerSchema, request.body);

  const result = await authService.register(input);

  return reply.status(201).send(result);
}

export async function loginController(request: FastifyRequest, reply: FastifyReply) {
  const input = validate(loginSchema, request.body);

  const result = await authService.login(input);

  return reply.status(200).send(result);
}

export async function refreshController(request: FastifyRequest, reply: FastifyReply) {
  const input = validate(refreshSchema, request.body);

  const result = await authService.refresh(input.refresh_token);

  return reply.send(result);
}

export async function logoutController(request: FastifyRequest, reply: FastifyReply) {
  const input = validate(logoutSchema, request.body);

  await authService.logout(input.refresh_token);

  return reply.status(204).send();
}

export async function meController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({
    user_id: request.auth.userId,

    organization_id: request.auth.organizationId,

    role: request.auth.role,
  });
}

export async function adminCheckController(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({
    allowed: true,

    role: request.auth.role,
  });
}
