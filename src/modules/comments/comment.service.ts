import { type AuthContext } from "../auth/auth.types.js";

import { assertTaskAccess } from "../tasks/task.service.js";

import { type CreateCommentInput } from "./comment.schema.js";

import * as commentRepository from "./comment.repository.js";

function mapComment(
  comment: NonNullable<Awaited<ReturnType<typeof commentRepository.findCommentById>>>,
) {
  return {
    id: comment.id,

    task_id: comment.taskId,

    body: comment.body,

    author: {
      id: comment.author.id,

      name: comment.author.name,

      email: comment.author.email,
    },

    created_at: comment.createdAt,

    updated_at: comment.updatedAt,
  };
}

export async function createComment(auth: AuthContext, taskId: string, input: CreateCommentInput) {
  await assertTaskAccess({
    auth,
    taskId,
  });

  const created = await commentRepository.createComment({
    taskId,

    authorUserId: auth.userId,

    body: input.body,
  });

  const comment = await commentRepository.findCommentById(created.id);

  if (!comment) {
    throw new Error("Comment was created but could not be loaded");
  }

  return mapComment(comment);
}

export async function listComments(auth: AuthContext, taskId: string) {
  await assertTaskAccess({
    auth,
    taskId,
  });

  const comments = await commentRepository.listComments(taskId);

  return comments.map((comment) => ({
    id: comment.id,

    task_id: comment.taskId,

    body: comment.body,

    author: {
      id: comment.author.id,

      name: comment.author.name,

      email: comment.author.email,
    },

    created_at: comment.createdAt,

    updated_at: comment.updatedAt,
  }));
}
