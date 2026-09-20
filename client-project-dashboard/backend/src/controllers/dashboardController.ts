import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export async function getDashboardStats(req: Request, res: Response) {
  try {
    const { userId, role } = req.user!;

    if (role === "ADMIN") {
      const [totalUsers, totalClients, totalProjects, totalTasks, completedTasks, overdueTasks, recentActivity] =
        await Promise.all([
          prisma.user.count(),
          prisma.client.count(),
          prisma.project.count(),
          prisma.task.count(),
          prisma.task.count({ where: { status: "COMPLETED" } }),
          prisma.task.count({ where: { status: "OVERDUE" } }),
          prisma.activity.findMany({
            orderBy: { createdAt: "desc" },
            take: 20,
            include: { user: { select: { name: true } } }
          })
        ]);

      return res.json({
        totalUsers,
        totalClients,
        totalProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
        recentActivity
      });
    }

    if (role === "PROJECT_MANAGER") {
      const myProjects = await prisma.project.findMany({ where: { managerId: userId } });
      const projectIds = myProjects.map((p) => p.id);

      const [teamTasks, completedTasks, pendingTasks, overdueTasks, teamActivity] = await Promise.all([
        prisma.task.count({ where: { projectId: { in: projectIds } } }),
        prisma.task.count({ where: { projectId: { in: projectIds }, status: "COMPLETED" } }),
        prisma.task.count({ where: { projectId: { in: projectIds }, status: { in: ["TODO", "IN_PROGRESS"] } } }),
        prisma.task.count({ where: { projectId: { in: projectIds }, status: "OVERDUE" } }),
        prisma.activity.findMany({
          where: { projectId: { in: projectIds } },
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { name: true } } }
        })
      ]);

      return res.json({
        myProjects: myProjects.length,
        teamTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        teamActivity
      });
    }

    // DEVELOPER
    const [myTasks, pending, inProgress, completed, overdue] = await Promise.all([
      prisma.task.count({ where: { assigneeId: userId } }),
      prisma.task.count({ where: { assigneeId: userId, status: "TODO" } }),
      prisma.task.count({ where: { assigneeId: userId, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { assigneeId: userId, status: "COMPLETED" } }),
      prisma.task.count({ where: { assigneeId: userId, status: "OVERDUE" } })
    ]);

    res.json({ myTasks, pending, inProgress, completed, overdue });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
}
