import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../controllers/notificationController";

const router = Router();

router.use(authenticate);

router.get("/", getNotifications);
router.patch("/:id/read", markNotificationRead);
router.patch("/read-all", markAllNotificationsRead);

export default router;
