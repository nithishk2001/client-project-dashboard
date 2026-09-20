export type Role = "ADMIN" | "PROJECT_MANAGER" | "DEVELOPER";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  company?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  client?: Client;
  managerId: string;
  manager?: { id: string; name: string };
  createdAt: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  projectId: string;
  project?: { id: string; name: string };
  assigneeId?: string;
  assignee?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  activities?: Activity[];
}

export interface Activity {
  id: string;
  userId: string;
  user?: { id: string; name: string };
  taskId?: string;
  projectId?: string;
  action: string;
  message: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  taskId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}
