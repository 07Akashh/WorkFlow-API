import { AppDataSource } from "../../config/database.js";

import { Comment } from "../../database/entities/comment.entity.js";

export async function createComment({
  taskId,
  authorUserId,
  body,
}: {
  taskId: string;
  authorUserId: string;
  body: string;
}): Promise<Comment> {
  const repository = AppDataSource.getRepository(Comment);

  return repository.save(
    repository.create({
      taskId,
      authorUserId,
      body,
    }),
  );
}

export async function listComments(taskId: string): Promise<Comment[]> {
  return AppDataSource.getRepository(Comment).find({
    where: {
      taskId,
    },

    relations: {
      author: true,
    },

    order: {
      createdAt: "ASC",
    },
  });
}

export async function findCommentById(commentId: string): Promise<Comment | null> {
  return AppDataSource.getRepository(Comment).findOne({
    where: {
      id: commentId,
    },

    relations: {
      author: true,
    },
  });
}
