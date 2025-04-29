// attendanceRoutes.js
import express from "express";
const sheduleManagerRouter = express.Router();

// define routes
sheduleManagerRouter.get("/", (req, res) => {
  res.send("Schedule manager Home");
});

export default sheduleManagerRouter;   // <-- IMPORTANT
