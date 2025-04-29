// attendanceRoutes.js
import express from "express";
const attendenceRouter = express.Router();

// define routes
attendenceRouter.get("/", (req, res) => {
  res.send("Attendance Home");
});

export default attendenceRouter;   // <-- IMPORTANT
