import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { createProjectSchema, updateProjectSchema } from "../utils/validators";

// GET /api/projects
// Admin -> all projects
// Project Manager -> only projects they manage
// Developer -> only projects that have a task assigned to them
export async function getProjects(req: Request, res: Response) {
  try {
    const { userId, role } = req.user!;

    let projects;

    if (role === "ADMIN") {
      projects = await prisma.project.findMany({
        include: { client: true, manager: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" }
      });
    } else if (role === "PROJECT_MANAGER") {
      projects = await prisma.project.findMany({
        where: { managerId: userId },
        include: { client: true, manager: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" }
      });
    } else {
      // DEVELOPER: projects that contain at least one task assigned to them
      projects = await prisma.project.findMany({
        where: { tasks: { some: { assigneeId: userId } } },
        include: { client: true, manager: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" }
      });
    }

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects" });
  }
}

export async function getProjectById(req: Request, res: Response) {
  try {
    const { userId, role } = req.user!;

    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        manager: { select: { id: true, name: true } },
        tasks: { include: { assignee: { select: { id: true, name: true } } } }
      }
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const hasAccess =
      role === "ADMIN" ||
      (role === "PROJECT_MANAGER" && project.managerId === userId) ||
      (role === "DEVELOPER" && project.tasks.some((t) => t.assigneeId === userId));

    if (!hasAccess) {
      return res.status(403).json({ message: "You do not have access to this project" });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch project" });
  }
}

// Only Admin and Project Manager can create projects.
// A Project Manager creating a project automatically becomes its manager.
export async function createProject(req: Request, res: Response) {
  try {
    const data = createProjectSchema.parse(req.body);
    const { userId, role } = req.user!;

    const managerId = role === "ADMIN" && req.body.managerId ? req.body.managerId : userId;

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        managerId
      }
    });

    res.status(201).json(project);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid project data" });
    }
    res.status(500).json({ message: "Failed to create project" });
  }
}

export async function updateProject(req: Request, res: Response) {
  try {
    const { userId, role } = req.user!;
    const data = updateProjectSchema.parse(req.body);

    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const canEdit = role === "ADMIN" || (role === "PROJECT_MANAGER" && project.managerId === userId);
    if (!canEdit) {
      return res.status(403).json({ message: "You do not have permission to update this project" });
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data
    });

    res.json(updated);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid project data" });
    }
    res.status(500).json({ message: "Failed to update project" });
  }
}

export async function deleteProject(req: Request, res: Response) {
  try {
    const { userId, role } = req.user!;

    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const canDelete = role === "ADMIN" || (role === "PROJECT_MANAGER" && project.managerId === userId);
    if (!canDelete) {
      return res.status(403).json({ message: "You do not have permission to delete this project" });
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete project" });
  }
}
