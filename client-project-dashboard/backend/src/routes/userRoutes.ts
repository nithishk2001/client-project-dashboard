import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/roleCheck";
import { getUsers, createUser, deleteUser, getDevelopers } from "../controllers/userController";

const router = Router();

router.use(authenticate);

// Any logged-in user can see the developer list (needed for task assignment dropdowns)
router.get("/developers", getDevelopers);

// Only Admin can manage users
router.get("/", requireRole("ADMIN"), getUsers);
router.post("/", requireRole("ADMIN"), createUser);
router.delete("/:id", requireRole("ADMIN"), deleteUser);

export default router;
