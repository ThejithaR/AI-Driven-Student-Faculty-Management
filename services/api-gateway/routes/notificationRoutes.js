// attendanceRoutes.js
import express from "express";
const notificationRouter = express.Router();

// define routes
notificationRouter.get("/", (req, res) => {
  res.send("Notification Home");
});

export default notificationRouter;   // <-- IMPORTANT
