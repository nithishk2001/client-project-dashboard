import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/roleCheck";
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
} from "../controllers/projectController";

const router = Router();

router.use(authenticate);

router.get("/", getProjects);
router.get("/:id", getProjectById);

router.post("/", requireRole("ADMIN", "PROJECT_MANAGER"), createProject);
router.put("/:id", requireRole("ADMIN", "PROJECT_MANAGER"), updateProject);
router.delete("/:id", requireRole("ADMIN", "PROJECT_MANAGER"), deleteProject);

export default router;
