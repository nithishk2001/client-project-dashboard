import { prisma } from "../lib/prisma";
import { broadcastToProject } from "../websocket/wsServer";

interface CreateActivityInput {
  userId: string;
  taskId?: string;
  projectId?: string;
  action: string;
  message: string;
}

// Creates an activity row in the DB and pushes it out over WebSocket
// to anyone currently viewing that project.
export async function createActivity(input: CreateActivityInput) {
  const activity = await prisma.activity.create({
    data: {
      userId: input.userId,
      taskId: input.taskId,
      projectId: input.projectId,
      action: input.action,
      message: input.message
    },
    include: {
      user: { select: { id: true, name: true, role: true } }
    }
  });

  if (input.projectId) {
    broadcastToProject(input.projectId, {
      type: "ACTIVITY",
      data: activity
    });
  }

  return activity;
}
