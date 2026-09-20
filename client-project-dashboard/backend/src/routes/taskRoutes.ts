import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/roleCheck";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask
} from "../controllers/taskController";

const router = Router();

router.use(authenticate);

router.get("/", getTasks);
router.get("/:id", getTaskById);

router.post("/", requireRole("ADMIN", "PROJECT_MANAGER"), createTask);
router.put("/:id", requireRole("ADMIN", "PROJECT_MANAGER"), updateTask);
router.delete("/:id", requireRole("ADMIN", "PROJECT_MANAGER"), deleteTask);

router.patch("/:id/status", updateTaskStatus);

export default router;
