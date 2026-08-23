import { type FastifyReply, type FastifyRequest } from "fastify";

import { validate } from "../../common/validation/validate.js";

import {
  createTaskSchema,
  listTasksQuerySchema,
  projectTaskParamsSchema,
  taskParamsSchema,
  updateTaskSchema,
} from "./task.schema.js";

import * as taskService from "./task.service.js";

export async function createTaskController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(projectTaskParamsSchema, request.params);

  const input = validate(createTaskSchema, request.body);

  const task = await taskService.createTask(request.auth, params.projectId, input);

  return reply.status(201).send(task);
}

export async function listTasksController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(projectTaskParamsSchema, request.params);

  const query = validate(listTasksQuerySchema, request.query);

  const result = await taskService.listTasks(request.auth, params.projectId, query);

  return reply.send(result);
}

export async function getTaskController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(taskParamsSchema, request.params);

  const task = await taskService.getTask(request.auth, params.taskId);

  return reply.send(task);
}

export async function updateTaskController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(taskParamsSchema, request.params);

  const input = validate(updateTaskSchema, request.body);

  const task = await taskService.updateTask({
    auth: request.auth,

    taskId: params.taskId,

    input,
  });

  return reply.send(task);
}

export async function deleteTaskController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(taskParamsSchema, request.params);

  await taskService.deleteTask({
    auth: request.auth,

    taskId: params.taskId,
  });

  return reply.status(204).send();
}

export async function projectDashboardController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(projectTaskParamsSchema, request.params);

  const result = await taskService.getProjectDashboard(request.auth, params.projectId);

  return reply.send(result);
}
