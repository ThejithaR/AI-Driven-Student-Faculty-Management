import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";

import userProfileRouter from "./routes/userProfileRoutes.js";
import attendenceRouter from "./routes/attendanceRoutes.js";
import chatbotRouter from "./routes/chatbotRoutes.js";
import courseEnrollmentRouter from "./routes/courseEnrollmentRoutes.js";
import sheduleManagerRouter from "./routes/scheduleManagerRoutes.js";
import notificationRouter from "./routes/notificationRoutes.js";

