import express from "express";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";

import protect from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/", protect, getNotifications);

router.get("/unread-count", protect, getUnreadNotificationCount);


router.patch("/:notificationId/read", protect, markNotificationAsRead);

router.patch("/read-all", protect, markAllNotificationsAsRead);


router.delete("/:notificationId", protect, deleteNotification);

router.delete("/", protect, deleteAllNotifications);

export default router;
