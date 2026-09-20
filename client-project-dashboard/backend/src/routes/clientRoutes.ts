import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/roleCheck";
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient
} from "../controllers/clientController";

const router = Router();

router.use(authenticate);

router.get("/", requireRole("ADMIN", "PROJECT_MANAGER"), getClients);
router.get("/:id", requireRole("ADMIN", "PROJECT_MANAGER"), getClientById);

router.post("/", requireRole("ADMIN"), createClient);
router.put("/:id", requireRole("ADMIN"), updateClient);
router.delete("/:id", requireRole("ADMIN"), deleteClient);

export default router;
