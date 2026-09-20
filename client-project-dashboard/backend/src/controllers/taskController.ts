import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema } from "../utils/validators";
import { createActivity } from "../services/activityService";
import { createNotification } from "../services/notificationService";

// GET /api/tasks?status=&priority=&projectId=
// Admin -> all tasks (filtered)
// Project Manager -> tasks in projects they manage (filtered)
// Developer -> only tasks assigned to them (filtered)
export async function getTasks(req: Request, res: Response) {
  try {
    const { userId, role } = req.user!;
    const { status, priority, projectId } = req.query;

    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (projectId) where.projectId = projectId;

    if (role === "PROJECT_MANAGER") {
      where.project = { managerId: userId };
    } else if (role === "DEVELOPER") {
      where.assigneeId = userId;
    }
    // ADMIN: no extra restriction

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
}

export async function getTaskById(req: Request, res: Response) {
  try {
    const { userId, role } = req.user!;

    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: true,
        assignee: { select: { id: true, name: true } },
        activities: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const hasAccess =
      role === "ADMIN" ||
      (role === "PROJECT_MANAGER" && task.project.managerId === userId) ||
      (role === "DEVELOPER" && task.assigneeId === userId);

    if (!hasAccess) {
      return res.status(403).json({ message: "You do not have access to this task" });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task" });
  }
}

// Only Admin and Project Manager can create tasks.
// A Project Manager can only create tasks inside projects they manage.
export async function createTask(req: Request, res: Response) {
  try {
    const { userId, role } = req.user!;
    const data = createTaskSchema.parse(req.body);

    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (role === "PROJECT_MANAGER" && project.managerId !== userId) {
      return res.status(403).json({ message: "You do not have permission to add tasks to this project" });
    }

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority || "MEDIUM",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId,
        assigneeId: data.assigneeId || null
      }
    });

    await createActivity({
      userId,
      taskId: task.id,
      projectId: task.projectId,
      action: "TASK_CREATED",
      message: `Task "${task.title}" was created`
    });

    if (task.assigneeId) {
      await createNotification({
        userId: task.assigneeId,
        taskId: task.id,
        message: `You have been assigned a new task: "${task.title}"`
      });
    }

    res.status(201).json(task);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid task data" });
    }
    res.status(500).json({ message: "Failed to create task" });
  }
}

// Update task details (title, description, priority, due date, assignee).
// Only Admin or the managing Project Manager can do this.
export async function updateTask(req: Request, res: Response) {
  try {
    const { userId, role } = req.user!;
    const data = updateTaskSchema.parse(req.body);

    const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { project: true } });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const canEdit = role === "ADMIN" || (role === "PROJECT_MANAGER" && task.project.managerId === userId);
    if (!canEdit) {
      return res.status(403).json({ message: "You do not have permission to update this task" });
    }

    const previousAssigneeId = task.assigneeId;

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assigneeId: data.assigneeId
      }
    });

    await createActivity({
      userId,
      taskId: updated.id,
      projectId: updated.projectId,
      action: "TASK_UPDATED",
      message: `Task "${updated.title}" was updated`
    });

    // If the assignee changed, let the new assignee know
    if (data.assigneeId && data.assigneeId !== previousAssigneeId) {
      await createNotification({
        userId: data.assigneeId,
        taskId: updated.id,
        message: `You have been assigned a new task: "${updated.title}"`
      });
    }

    res.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid task data" });
    }
    res.status(500).json({ message: "Failed to update task" });
  }
}

// PATCH /api/tasks/:id/status
// Developers can only update the status of tasks assigned to them.
// Admin and the managing Project Manager can also update status.
export async function updateTaskStatus(req: Request, res: Response) {
  try {
    const { userId, role } = req.user!;
    const { status } = updateTaskStatusSchema.parse(req.body);

    const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { project: true } });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const canUpdate =
      role === "ADMIN" ||
      (role === "PROJECT_MANAGER" && task.project.managerId === userId) ||
      (role === "DEVELOPER" && task.assigneeId === userId);

    if (!canUpdate) {
      return res.status(403).json({ message: "You do not have permission to update this task" });
    }

    const previousStatus = task.status;

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: { status }
    });

    // Store who changed it and when, as an activity log entry
    await createActivity({
      userId,
      taskId: updated.id,
      projectId: updated.projectId,
      action: "STATUS_CHANGED",
      message: `Task "${updated.title}" changed from ${previousStatus} to ${status}`
    });

    // Let the project manager know when a task is completed
    if (status === "COMPLETED") {
      await createNotification({
        userId: task.project.managerId,
        taskId: updated.id,
        message: `Task "${updated.title}" was completed`
      });
    }

    res.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid status value" });
    }
    res.status(500).json({ message: "Failed to update task status" });
  }
}

export async function deleteTask(req: Request, res: Response) {
  try {
    const { userId, role } = req.user!;

    const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { project: true } });
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const canDelete = role === "ADMIN" || (role === "PROJECT_MANAGER" && task.project.managerId === userId);
    if (!canDelete) {
      return res.status(403).json({ message: "You do not have permission to delete this task" });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete task" });
  }
}
