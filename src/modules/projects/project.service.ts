import { AppError } from "../../common/errors/app-error.js";

import { ErrorCode } from "../../common/errors/error-codes.js";

import { type AuthContext } from "../auth/auth.types.js";

import {
  type CreateProjectInput,
  type ListProjectsQuery,
  type UpdateProjectInput,
} from "./project.schema.js";

import * as projectRepository from "./project.repository.js";

function mapProject(
  project: NonNullable<Awaited<ReturnType<typeof projectRepository.findProjectById>>>,
) {
  return {
    id: project.id,

    name: project.name,

    description: project.description,

    created_by_user_id: project.createdByUserId,

    created_at: project.createdAt,

    updated_at: project.updatedAt,
  };
}

export async function assertProjectAccess({
  auth,
  projectId,
}: {
  auth: AuthContext;
  projectId: string;
}): Promise<void> {
  const ownership = await projectRepository.findProjectOwnership(projectId);

  if (!ownership || ownership.deletedAt) {
    throw new AppError({
      message: "Project not found",
      code: ErrorCode.PROJECT_NOT_FOUND,
      statusCode: 404,
      details: {},
    });
  }

  if (ownership.organizationId !== auth.organizationId) {
    throw new AppError({
      message: "Access to this project is forbidden",

      code: ErrorCode.PROJECT_FORBIDDEN,

      statusCode: 403,
      details: {},
    });
  }
}
export async function createProject(auth: AuthContext, input: CreateProjectInput) {
  const project = await projectRepository.createProject({
    organizationId: auth.organizationId,

    createdByUserId: auth.userId,

    input,
  });

  return mapProject(project);
}

export async function listProjects(auth: AuthContext, query: ListProjectsQuery) {
  const result = await projectRepository.listProjects({
    organizationId: auth.organizationId,

    limit: query.limit,

    cursor: query.cursor,
  });

  return {
    data: result.data.map(mapProject),

    next_cursor: result.nextCursor,
  };
}

export async function getProject(auth: AuthContext, projectId: string) {
  await assertProjectAccess({
    auth,
    projectId,
  });

  const project = await projectRepository.findProjectById({
    projectId,

    organizationId: auth.organizationId,
  });

  if (!project) {
    throw new AppError({
      message: "Project not found",

      code: ErrorCode.PROJECT_NOT_FOUND,

      statusCode: 404,

      details: {},
    });
  }

  return mapProject(project);
}

export async function updateProject({
  auth,
  projectId,
  input,
}: {
  auth: AuthContext;
  projectId: string;
  input: UpdateProjectInput;
}) {
  await assertProjectAccess({
    auth,
    projectId,
  });

  const project = await projectRepository.findProjectById({
    projectId,

    organizationId: auth.organizationId,
  });

  if (!project) {
    throw new AppError({
      message: "Project not found",

      code: ErrorCode.PROJECT_NOT_FOUND,

      statusCode: 404,

      details: {},
    });
  }

  const updated = await projectRepository.updateProject({
    project,
    input,
  });

  return mapProject(updated);
}

export async function deleteProject({
  auth,
  projectId,
}: {
  auth: AuthContext;
  projectId: string;
}): Promise<void> {
  await assertProjectAccess({
    auth,
    projectId,
  });

  await projectRepository.deleteProject({
    projectId,

    organizationId: auth.organizationId,
  });
}
