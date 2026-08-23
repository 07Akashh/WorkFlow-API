import { AppDataSource } from "../../config/database.js";

import { Project } from "../../database/entities/project.entity.js";

import { type CreateProjectInput, type UpdateProjectInput } from "./project.schema.js";

import { decodeCursor, encodeCursor } from "../../common/pagination/cursor.js";

export async function createProject({
  organizationId,
  createdByUserId,
  input,
}: {
  organizationId: string;
  createdByUserId: string;
  input: CreateProjectInput;
}): Promise<Project> {
  const repository = AppDataSource.getRepository(Project);

  const project = repository.create({
    organizationId,

    createdByUserId,

    name: input.name,

    description: input.description ?? null,
  });

  return repository.save(project);
}

export interface ProjectOwnership {
  id: string;
  organizationId: string;
  deletedAt: Date | null;
}

export async function findProjectOwnership(projectId: string): Promise<ProjectOwnership | null> {
  const project = await AppDataSource.getRepository(Project)
    .createQueryBuilder("project")
    .withDeleted()
    .select(["project.id", "project.organizationId", "project.deletedAt"])
    .where("project.id = :projectId", {
      projectId,
    })
    .getOne();

  if (!project) {
    return null;
  }

  return {
    id: project.id,

    organizationId: project.organizationId,

    deletedAt: project.deletedAt,
  };
}

export async function findProjectById({
  projectId,
  organizationId,
}: {
  projectId: string;
  organizationId: string;
}): Promise<Project | null> {
  return AppDataSource.getRepository(Project).findOne({
    where: {
      id: projectId,

      organizationId,
    },
  });
}

export async function listProjects({
  organizationId,
  limit,
  cursor,
}: {
  organizationId: string;
  limit: number;
  cursor?: string;
}): Promise<{
  data: Project[];
  nextCursor: string | null;
}> {
  const repository = AppDataSource.getRepository(Project);

  const query = repository
    .createQueryBuilder("project")
    .where("project.organization_id = :organizationId", {
      organizationId,
    })
    .andWhere("project.deleted_at IS NULL")
    .orderBy("project.created_at", "DESC")
    .addOrderBy("project.id", "DESC")
    .take(limit + 1);

  if (cursor) {
    const decoded = decodeCursor(cursor);

    query.andWhere(
      `(
        project.created_at < :cursorCreatedAt
        OR (
          project.created_at = :cursorCreatedAt
          AND project.id < :cursorId
        )
      )`,
      {
        cursorCreatedAt: decoded.createdAt,

        cursorId: decoded.id,
      },
    );
  }

  const results = await query.getMany();

  const hasMore = results.length > limit;

  const data = hasMore ? results.slice(0, limit) : results;

  const lastProject = data.at(-1);

  const nextCursor =
    hasMore && lastProject
      ? encodeCursor({
          createdAt: lastProject.createdAt.toISOString(),

          id: lastProject.id,
        })
      : null;

  return {
    data,
    nextCursor,
  };
}

export async function updateProject({
  project,
  input,
}: {
  project: Project;
  input: UpdateProjectInput;
}): Promise<Project> {
  if (input.name !== undefined) {
    project.name = input.name;
  }

  if (input.description !== undefined) {
    project.description = input.description;
  }

  return AppDataSource.getRepository(Project).save(project);
}

export async function deleteProject({
  projectId,
  organizationId,
}: {
  projectId: string;
  organizationId: string;
}): Promise<void> {
  await AppDataSource.getRepository(Project).softDelete({
    id: projectId,

    organizationId,
  });
}
