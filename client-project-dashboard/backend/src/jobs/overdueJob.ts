import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { createActivity } from "../services/activityService";
import { createNotification } from "../services/notificationService";

// Runs once every hour. Finds tasks whose due date has passed but are
// not completed yet, marks them OVERDUE, and logs/notifies about it.
export function startOverdueJob() {
  cron.schedule("0 * * * *", async () => {
    console.log("Running overdue task job...");
    await markOverdueTasks();
  });
}

// Exported separately so it can also be triggered manually/for testing
export async function markOverdueTasks() {
  const now = new Date();

  const overdueTasks = await prisma.task.findMany({
    where: {
      dueDate: { lt: now },
      status: { not: "COMPLETED" },
      NOT: { status: "OVERDUE" }
    },
    include: { project: true }
  });

  for (const task of overdueTasks) {
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "OVERDUE" }
    });

    await createActivity({
      userId: task.project.managerId,
      taskId: task.id,
      projectId: task.projectId,
      action: "TASK_OVERDUE",
      message: `Task "${task.title}" became overdue`
    });

    if (task.assigneeId) {
      await createNotification({
        userId: task.assigneeId,
        taskId: task.id,
        message: `Task "${task.title}" is overdue`
      });
    }
  }

  if (overdueTasks.length > 0) {
    console.log(`Marked ${overdueTasks.length} task(s) as overdue`);
  }
}
