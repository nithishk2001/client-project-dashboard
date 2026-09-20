import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { createClientSchema } from "../utils/validators";

export async function getClients(req: Request, res: Response) {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch clients" });
  }
}

export async function getClientById(req: Request, res: Response) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: { projects: true }
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    res.json(client);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch client" });
  }
}

export async function createClient(req: Request, res: Response) {
  try {
    const data = createClientSchema.parse(req.body);
    const client = await prisma.client.create({ data });
    res.status(201).json(client);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: "Invalid client data" });
    }
    res.status(500).json({ message: "Failed to create client" });
  }
}

export async function updateClient(req: Request, res: Response) {
  try {
    const client = await prisma.client.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: "Failed to update client" });
  }
}

export async function deleteClient(req: Request, res: Response) {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    res.json({ message: "Client deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete client" });
  }
}
