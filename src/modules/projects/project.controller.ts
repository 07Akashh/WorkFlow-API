import { type FastifyReply, type FastifyRequest } from "fastify";

import { validate } from "../../common/validation/validate.js";

import {
  createProjectSchema,
  listProjectsQuerySchema,
  projectParamsSchema,
  updateProjectSchema,
} from "./project.schema.js";

import * as projectService from "./project.service.js";

export async function createProjectController(request: FastifyRequest, reply: FastifyReply) {
  const input = validate(createProjectSchema, request.body);

  const project = await projectService.createProject(request.auth, input);

  return reply.status(201).send(project);
}

export async function listProjectsController(request: FastifyRequest, reply: FastifyReply) {
  const query = validate(listProjectsQuerySchema, request.query);

  const result = await projectService.listProjects(request.auth, query);

  return reply.send(result);
}

export async function getProjectController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(projectParamsSchema, request.params);

  const project = await projectService.getProject(request.auth, params.projectId);

  return reply.send(project);
}

export async function updateProjectController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(projectParamsSchema, request.params);

  const input = validate(updateProjectSchema, request.body);

  const project = await projectService.updateProject({
    auth: request.auth,

    projectId: params.projectId,

    input,
  });

  return reply.send(project);
}

export async function deleteProjectController(request: FastifyRequest, reply: FastifyReply) {
  const params = validate(projectParamsSchema, request.params);

  await projectService.deleteProject({
    auth: request.auth,

    projectId: params.projectId,
  });

  return reply.status(204).send();
}
