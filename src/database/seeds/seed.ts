import "reflect-metadata";
import "dotenv/config";

import bcrypt from "bcrypt";

import { AppDataSource } from "../../config/database.js";

import { Comment } from "../entities/comment.entity.js";
import { Organization } from "../entities/organization.entity.js";
import { OrgMember } from "../entities/org-member.entity.js";
import { Project } from "../entities/project.entity.js";
import { Task } from "../entities/task.entity.js";
import { TaskAssignment } from "../entities/task-assignment.entity.js";
import { User } from "../entities/user.entity.js";

import { OrgRole } from "../enums/org-role.enum.js";
import { TaskPriority } from "../enums/task-priority.enum.js";
import { TaskStatus } from "../enums/task-status.enum.js";

function daysFromNow(days: number): Date {
  const date = new Date();

  date.setDate(date.getDate() + days);

  return date;
}

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  try {
    await AppDataSource.transaction(async (manager) => {
      const organizationRepository = manager.getRepository(Organization);

      const existingOrganizations = await organizationRepository.count();

      if (existingOrganizations > 0) {
        console.log("Seed skipped: database already contains organization data.");

        return;
      }

      const seedPassword = process.env.SEED_USER_PASSWORD ?? "TaskFlowDev@123";

      const passwordHash = await bcrypt.hash(seedPassword, 12);

      /*
       * -------------------------------------------------
       * Organizations
       * -------------------------------------------------
       */

      const acmeLabs = await organizationRepository.save(
        organizationRepository.create({
          name: "Acme Labs",
          slug: "acme-labs",
        }),
      );

      const novaSystems = await organizationRepository.save(
        organizationRepository.create({
          name: "Nova Systems",
          slug: "nova-systems",
        }),
      );

      /*
       * -------------------------------------------------
       * Users
       * -------------------------------------------------
       */

      const userRepository = manager.getRepository(User);

      const alice = await userRepository.save(
        userRepository.create({
          name: "Alice Johnson",
          email: "aonecreations1+alicejohnson@gmail.com",
          passwordHash,
          isActive: true,
        }),
      );

      const bob = await userRepository.save(
        userRepository.create({
          name: "Bob Smith",
          email: "aonecreations1+bobsmith@gmail.com",
          passwordHash,
          isActive: true,
        }),
      );

      const carol = await userRepository.save(
        userRepository.create({
          name: "Carol Williams",
          email: "aonecreations1+carolwilliams@gmail.com",
          passwordHash,
          isActive: true,
        }),
      );

      const david = await userRepository.save(
        userRepository.create({
          name: "David Miller",
          email: "aonecreations1+davidmiller@gmail.com",
          passwordHash,
          isActive: true,
        }),
      );

      const eva = await userRepository.save(
        userRepository.create({
          name: "Eva Brown",
          email: "aonecreations1+evabrown@gmail.com",
          passwordHash,
          isActive: true,
        }),
      );

      /*
       * -------------------------------------------------
       * Organization memberships
       * -------------------------------------------------
       */

      const orgMemberRepository = manager.getRepository(OrgMember);

      await orgMemberRepository.save(
        orgMemberRepository.create([
          {
            organizationId: acmeLabs.id,
            userId: alice.id,
            role: OrgRole.ORG_ADMIN,
          },
          {
            organizationId: acmeLabs.id,
            userId: bob.id,
            role: OrgRole.MEMBER,
          },
          {
            organizationId: acmeLabs.id,
            userId: carol.id,
            role: OrgRole.MEMBER,
          },

          {
            organizationId: novaSystems.id,
            userId: david.id,
            role: OrgRole.ORG_ADMIN,
          },
          {
            organizationId: novaSystems.id,
            userId: eva.id,
            role: OrgRole.MEMBER,
          },
        ]),
      );

      /*
       * -------------------------------------------------
       * Projects
       * -------------------------------------------------
       */

      const projectRepository = manager.getRepository(Project);

      const taskFlowApi = await projectRepository.save(
        projectRepository.create({
          organizationId: acmeLabs.id,
          name: "TaskFlow API",
          description: "Backend platform for TaskFlow project management.",
          createdByUserId: alice.id,
        }),
      );

      const customerPortal = await projectRepository.save(
        projectRepository.create({
          organizationId: acmeLabs.id,
          name: "Customer Portal",
          description: "Internal customer management portal.",
          createdByUserId: alice.id,
        }),
      );

      const novaDashboard = await projectRepository.save(
        projectRepository.create({
          organizationId: novaSystems.id,
          name: "Nova Dashboard",
          description: "Operational dashboard for Nova Systems.",
          createdByUserId: david.id,
        }),
      );

      /*
       * -------------------------------------------------
       * Tasks
       * -------------------------------------------------
       */

      const taskRepository = manager.getRepository(Task);

      const tasks = await taskRepository.save(
        taskRepository.create([
          {
            projectId: taskFlowApi.id,
            title: "Design database schema",
            description: "Define organizations, users, projects and task relationships.",
            status: TaskStatus.DONE,
            priority: TaskPriority.HIGH,
            dueDate: daysFromNow(-3),
            createdByUserId: alice.id,
          },

          {
            projectId: taskFlowApi.id,
            title: "Implement JWT authentication",
            description: "Implement access and refresh token authentication.",
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.URGENT,
            dueDate: daysFromNow(2),
            createdByUserId: alice.id,
          },

          {
            projectId: taskFlowApi.id,
            title: "Implement tenant middleware",
            description: "Attach authenticated organization context to requests.",
            status: TaskStatus.TODO,
            priority: TaskPriority.URGENT,
            dueDate: daysFromNow(4),
            createdByUserId: alice.id,
          },

          {
            projectId: taskFlowApi.id,
            title: "Build project CRUD",
            description: "Implement tenant-scoped project CRUD endpoints.",
            status: TaskStatus.TODO,
            priority: TaskPriority.HIGH,
            dueDate: daysFromNow(7),
            createdByUserId: alice.id,
          },

          {
            projectId: taskFlowApi.id,
            title: "Build BullMQ worker",
            description: "Create worker responsible for asynchronous notifications.",
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            dueDate: daysFromNow(10),
            createdByUserId: alice.id,
          },

          {
            projectId: customerPortal.id,
            title: "Create customer dashboard",
            description: "Implement initial customer dashboard API requirements.",
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.MEDIUM,
            dueDate: daysFromNow(5),
            createdByUserId: bob.id,
          },

          {
            projectId: customerPortal.id,
            title: "Review dashboard API",
            description: "Perform technical review before release.",
            status: TaskStatus.REVIEW,
            priority: TaskPriority.HIGH,
            dueDate: daysFromNow(1),
            createdByUserId: alice.id,
          },

          {
            projectId: customerPortal.id,
            title: "Write integration tests",
            description: "Add integration coverage for customer APIs.",
            status: TaskStatus.TODO,
            priority: TaskPriority.LOW,
            dueDate: daysFromNow(12),
            createdByUserId: carol.id,
          },

          {
            projectId: novaDashboard.id,
            title: "Create dashboard metrics",
            description: "Implement dashboard summary metrics.",
            status: TaskStatus.DONE,
            priority: TaskPriority.HIGH,
            dueDate: daysFromNow(-1),
            createdByUserId: david.id,
          },

          {
            projectId: novaDashboard.id,
            title: "Optimize metrics query",
            description: "Improve dashboard aggregation query performance.",
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.HIGH,
            dueDate: daysFromNow(3),
            createdByUserId: david.id,
          },

          {
            projectId: novaDashboard.id,
            title: "Add dashboard filters",
            description: "Support filtering metrics by operational period.",
            status: TaskStatus.REVIEW,
            priority: TaskPriority.MEDIUM,
            dueDate: daysFromNow(6),
            createdByUserId: eva.id,
          },

          {
            projectId: novaDashboard.id,
            title: "Document dashboard APIs",
            description: "Prepare API documentation for dashboard endpoints.",
            status: TaskStatus.TODO,
            priority: TaskPriority.LOW,
            dueDate: daysFromNow(14),
            createdByUserId: eva.id,
          },
        ]),
      );

      function getTask(title: string): Task {
        const task = tasks.find((candidate) => candidate.title === title);

        if (!task) {
          throw new Error(`Seed task not found: ${title}`);
        }

        return task;
      }

      /*
       * -------------------------------------------------
       * Task assignments
       * -------------------------------------------------
       */

      const assignmentRepository = manager.getRepository(TaskAssignment);

      await assignmentRepository.save(
        assignmentRepository.create([
          {
            taskId: getTask("Implement JWT authentication").id,
            userId: bob.id,
            assignedByUserId: alice.id,
          },

          {
            taskId: getTask("Implement tenant middleware").id,
            userId: carol.id,
            assignedByUserId: alice.id,
          },

          {
            taskId: getTask("Build project CRUD").id,
            userId: bob.id,
            assignedByUserId: alice.id,
          },

          {
            taskId: getTask("Create customer dashboard").id,
            userId: bob.id,
            assignedByUserId: alice.id,
          },

          {
            taskId: getTask("Write integration tests").id,
            userId: carol.id,
            assignedByUserId: alice.id,
          },

          {
            taskId: getTask("Optimize metrics query").id,
            userId: eva.id,
            assignedByUserId: david.id,
          },

          {
            taskId: getTask("Add dashboard filters").id,
            userId: eva.id,
            assignedByUserId: david.id,
          },
        ]),
      );

      /*
       * -------------------------------------------------
       * Comments
       * -------------------------------------------------
       */

      const commentRepository = manager.getRepository(Comment);

      await commentRepository.save(
        commentRepository.create([
          {
            taskId: getTask("Implement JWT authentication").id,
            authorUserId: alice.id,
            body: "Please include refresh token revocation support.",
          },

          {
            taskId: getTask("Implement JWT authentication").id,
            authorUserId: bob.id,
            body: "Access token flow is currently being implemented.",
          },

          {
            taskId: getTask("Review dashboard API").id,
            authorUserId: carol.id,
            body: "Initial API review is complete. A few validation cases remain.",
          },

          {
            taskId: getTask("Optimize metrics query").id,
            authorUserId: david.id,
            body: "Please verify indexes before finalizing the optimization.",
          },

          {
            taskId: getTask("Add dashboard filters").id,
            authorUserId: eva.id,
            body: "Date-range filtering is ready for review.",
          },
        ]),
      );

      console.log("TaskFlow seed completed successfully.");

      console.log({
        organizations: 2,
        users: 5,
        projects: 3,
        tasks: tasks.length,
        assignments: 7,
        comments: 5,
        seedPassword,
      });
    });
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seed().catch((error: unknown) => {
  console.error("TaskFlow seed failed:", error);

  process.exitCode = 1;
});
