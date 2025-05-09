import express from "express";
import {
  getNotifications,
  getNotificationDetails,
  addNotification,
  getAdminNotifications,
  getAdminNotificationDetails,
} from "../controllers/notificationController.js";

const notificationRouter = express.Router();

// Route to get notifications for a specific user
notificationRouter.get("/user/:userId", getNotifications);

// Route to get details of a specific notification (for students)
notificationRouter.get("/:notificationId", getNotificationDetails);

// Route to add a notification (admin only)
notificationRouter.post("/add", addNotification);

// Route to get notifications sent by an admin (faculty members)
notificationRouter.get("/admin/:facultyId", getAdminNotifications);

// Route to get details of a specific notification sent by an admin
notificationRouter.get("/admin/notification/:notificationId", getAdminNotificationDetails);

export default notificationRouter;