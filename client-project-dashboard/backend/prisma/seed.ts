import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const password = await bcrypt.hash("Password@123", 10);

  // ---- Users ----
  const admin = await prisma.user.create({
    data: { name: "Admin User", email: "admin@test.com", password, role: "ADMIN" }
  });

  const manager = await prisma.user.create({
    data: { name: "Project Manager", email: "manager@test.com", password, role: "PROJECT_MANAGER" }
  });

  const dev1 = await prisma.user.create({
    data: { name: "Developer One", email: "developer@test.com", password, role: "DEVELOPER" }
  });

  const dev2 = await prisma.user.create({
    data: { name: "Developer Two", email: "developer2@test.com", password, role: "DEVELOPER" }
  });

  // ---- Clients ----
  const client1 = await prisma.client.create({
    data: { name: "Acme Corp", email: "contact@acme.com", company: "Acme Corp" }
  });

  const client2 = await prisma.client.create({
    data: { name: "Globex Inc", email: "contact@globex.com", company: "Globex Inc" }
  });

  // ---- Projects ----
  const project1 = await prisma.project.create({
    data: {
      name: "Website Redesign",
      description: "Redesign the Acme Corp marketing website",
      clientId: client1.id,
      managerId: manager.id
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name: "Payment Platform",
      description: "Build a new payment processing platform for Globex",
      clientId: client2.id,
      managerId: manager.id
    }
  });

  // ---- Tasks ----
  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  const task1 = await prisma.task.create({
    data: {
      title: "Design homepage mockup",
      description: "Create a Figma mockup for the new homepage",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: inThreeDays,
      projectId: project1.id,
      assigneeId: dev1.id
    }
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Set up CI pipeline",
      description: "Configure GitHub Actions for automated testing",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: inThreeDays,
      projectId: project1.id,
      assigneeId: dev2.id
    }
  });

  const task3 = await prisma.task.create({
    data: {
      title: "Login API",
      description: "Implement JWT-based login endpoint",
      status: "COMPLETED",
      priority: "HIGH",
      dueDate: yesterday,
      projectId: project2.id,
      assigneeId: dev1.id
    }
  });

  const task4 = await prisma.task.create({
    data: {
      title: "Payment API",
      description: "Integrate Stripe payment processing",
      status: "TODO",
      priority: "HIGH",
      dueDate: yesterday, // already overdue, cron job will flip this on next run
      projectId: project2.id,
      assigneeId: dev2.id
    }
  });

  // ---- Activities ----
  await prisma.activity.createMany({
    data: [
      {
        userId: manager.id,
        taskId: task1.id,
        projectId: project1.id,
        action: "TASK_CREATED",
        message: `Task "${task1.title}" was created`
      },
      {
        userId: dev1.id,
        taskId: task1.id,
        projectId: project1.id,
        action: "STATUS_CHANGED",
        message: `Developer changed "${task1.title}" from TODO to IN_PROGRESS`
      },
      {
        userId: dev1.id,
        taskId: task3.id,
        projectId: project2.id,
        action: "STATUS_CHANGED",
        message: `Developer changed "${task3.title}" from IN_PROGRESS to COMPLETED`
      }
    ]
  });

  // ---- Notifications ----
  await prisma.notification.createMany({
    data: [
      { userId: dev1.id, taskId: task1.id, message: `You have been assigned a new task: "${task1.title}"` },
      { userId: dev2.id, taskId: task2.id, message: `You have been assigned a new task: "${task2.title}"` },
      { userId: manager.id, taskId: task3.id, message: `Task "${task3.title}" was completed` }
    ]
  });

  console.log("Seeding complete!");
  console.log("Login credentials (password for all: Password@123):");
  console.log("  Admin:   admin@test.com");
  console.log("  Manager: manager@test.com");
  console.log("  Dev 1:   developer@test.com");
  console.log("  Dev 2:   developer2@test.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
