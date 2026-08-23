import { type FastifyReply, type FastifyRequest } from "fastify";

import { validate } from "../../common/validation/validate.js";

import { commentTaskParamsSchema, createCommentSchema } from "./comment.schema.js";

import * as commentService from "./comment.service.js";

export async function createCommentController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(commentTaskParamsSchema, request.params);

  const input = validate(createCommentSchema, request.body);

  const comment = await commentService.createComment(request.auth, params.taskId, input);

  return reply.status(201).send(comment);
}

export async function listCommentsController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(commentTaskParamsSchema, request.params);

  const comments = await commentService.listComments(request.auth, params.taskId);

  return reply.send({
    data: comments,
  });
}
