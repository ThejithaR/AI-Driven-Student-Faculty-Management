// attendanceRoutes.js
import express from "express";
import { getEnrolledCourses, getEligibleCourses, getAssignedCourses, getAllCourses, enrollInCourse, unenrollFromCourse} from "../controllers/coursesController.js";
const courseEnrollmentRouter = express.Router();

// define routes
courseEnrollmentRouter.get("/", (req, res) => {
  res.send("Coursse enrollments Home");
});

courseEnrollmentRouter.post("/enrolled", getEnrolledCourses)
courseEnrollmentRouter.post("/eligible", getEligibleCourses)
courseEnrollmentRouter.post("/assigned", getAssignedCourses)
courseEnrollmentRouter.get("/all", getAllCourses)
courseEnrollmentRouter.post("/enroll", enrollInCourse)
courseEnrollmentRouter.post("/unenroll", unenrollFromCourse)

export default courseEnrollmentRouter;   // <-- IMPORTANT
