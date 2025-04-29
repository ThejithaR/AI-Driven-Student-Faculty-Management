// attendanceRoutes.js
import express from "express";
const courseEnrollmentRouter = express.Router();

// define routes
courseEnrollmentRouter.get("/", (req, res) => {
  res.send("Coursse enrollments Home");
});

export default courseEnrollmentRouter;   // <-- IMPORTANT
