import { type EntityManager } from "typeorm";

import { AppDataSource } from "../../config/database.js";
import { OrgMember } from "../../database/entities/org-member.entity.js";
import { TaskAssignment } from "../../database/entities/task-assignment.entity.js";

export async function findOrganizationMember({
  organizationId,
  userId,
}: {
  organizationId: string;
  userId: string;
}): Promise<OrgMember | null> {
  return AppDataSource.getRepository(OrgMember).findOne({
    where: {
      organizationId,
      userId,
    },

    relations: {
      user: true,
    },
  });
}

export async function findAssignment({
  taskId,
  userId,
}: {
  taskId: string;
  userId: string;
}): Promise<TaskAssignment | null> {
  return AppDataSource.getRepository(TaskAssignment).findOne({
    where: {
      taskId,
      userId,
    },

    relations: {
      user: true,
    },
  });
}

export async function createAssignment({
  taskId,
  userId,
  assignedByUserId,
}: {
  taskId: string;
  userId: string;
  assignedByUserId: string;
}): Promise<TaskAssignment> {
  const repository = AppDataSource.getRepository(TaskAssignment);

  return repository.save(
    repository.create({
      taskId,
      userId,
      assignedByUserId,
    }),
  );
}

export async function createAssignmentWithManager({
  manager,
  taskId,
  userId,
  assignedByUserId,
}: {
  manager: EntityManager;

  taskId: string;

  userId: string;

  assignedByUserId: string;
}): Promise<TaskAssignment> {
  const repository = manager.getRepository(TaskAssignment);

  return repository.save(
    repository.create({
      taskId,
      userId,
      assignedByUserId,
    }),
  );
}

export async function listAssignments(taskId: string): Promise<TaskAssignment[]> {
  return AppDataSource.getRepository(TaskAssignment).find({
    where: {
      taskId,
    },

    relations: {
      user: true,
    },

    order: {
      createdAt: "ASC",
    },
  });
}

export async function deleteAssignment(assignment: TaskAssignment): Promise<void> {
  await AppDataSource.getRepository(TaskAssignment).remove(assignment);
}
