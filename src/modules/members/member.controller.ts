import { type FastifyReply, type FastifyRequest } from "fastify";

import { validate } from "../../common/validation/validate.js";

import { addMemberSchema, memberParamsSchema, updateMemberRoleSchema } from "./member.schema.js";

import * as memberService from "./member.service.js";

export async function listMembersController(request: FastifyRequest, reply: FastifyReply) {
  const members = await memberService.listMembers(request.auth);

  return reply.send({
    data: members,
  });
}

export async function addMemberController(request: FastifyRequest, reply: FastifyReply) {
  const input = validate(addMemberSchema, request.body);

  const member = await memberService.addMember(request.auth, input);

  return reply.status(201).send(member);
}

export async function updateMemberRoleController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(memberParamsSchema, request.params);

  const input = validate(updateMemberRoleSchema, request.body);

  const member = await memberService.updateMemberRole({
    auth: request.auth,

    targetUserId: params.userId,

    role: input.role,
  });

  return reply.send(member);
}

export async function removeMemberController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(memberParamsSchema, request.params);

  await memberService.removeMember({
    auth: request.auth,

    targetUserId: params.userId,
  });

  return reply.status(204).send();
}
