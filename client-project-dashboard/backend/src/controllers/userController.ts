import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import { createUserSchema } from "../utils/validators";

export async function getUsers(req: Request, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    res.status(201).json(user);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid user data" });
    }
    res.status(500).json({ message: "Failed to create user" });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
}

// Used to populate "assignee" dropdowns when creating/assigning tasks
export async function getDevelopers(req: Request, res: Response) {
  try {
    const developers = await prisma.user.findMany({
      where: { role: "DEVELOPER" },
      select: { id: true, name: true, email: true }
    });
    res.json(developers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch developers" });
  }
}
