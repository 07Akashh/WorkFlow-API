import { type FastifyReply, type FastifyRequest } from "fastify";

import { validate } from "../../common/validation/validate.js";

import {
  createAssignmentSchema,
  deleteAssignmentParamsSchema,
  taskAssignmentParamsSchema,
} from "./assignment.schema.js";

import * as assignmentService from "./assignment.service.js";

export async function assignUserController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(taskAssignmentParamsSchema, request.params);

  const input = validate(createAssignmentSchema, request.body);

  const result = await assignmentService.assignUser({
    auth: request.auth,

    taskId: params.taskId,

    input,
  });

  return reply.status(201).send(result);
}

export async function listAssignmentsController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(taskAssignmentParamsSchema, request.params);

  const assignments = await assignmentService.listAssignments(request.auth, params.taskId);

  return reply.send({
    data: assignments,
  });
}

export async function unassignUserController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(deleteAssignmentParamsSchema, request.params);

  await assignmentService.unassignUser({
    auth: request.auth,

    taskId: params.taskId,

    userId: params.userId,
  });

  return reply.status(204).send();
}
