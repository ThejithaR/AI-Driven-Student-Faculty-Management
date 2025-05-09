import { Routes, Route, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React from "react";
import Home from "./pages/Home";
import UserProfiles from "./pages/user_profiles/UserProfiles";
import Login from "./pages/user_profiles/Login";
// import EditProfile from "./pages/user_profiles/EditProfile";
// import ResetPassword from "./pages/user_profiles/ResetPassword";
import Attendance from "./pages/attendance/attendance";
import Chatbot from "./pages/chatbot";
import ScheduleManager from "./pages/scheduleManager";
import Notifications from "./pages/notifications";

import Courses from "./pages/courses/CoursePage";

//import CourseEnrollments from "./pages/courseEnrollments";
import RegisterFace from "./pages/attendance/registerFace";
import ManualAttendance from "./pages/attendance/manualAttendance";
import RealtimeAttendance from "./pages/attendance/realtimeAttendance";

const App = () => {
  return (
    <>
      {/* ToastContainer should be included once, at the top level */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user-profiles" element={<UserProfiles />} />
        <Route path="/login" element={<Login />} />
        {/* <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/reset-password" element={<ResetPassword />} /> */}
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/register-face" element={<RegisterFace />} />
        <Route path="/manual-attendance" element={<ManualAttendance />} />
        <Route path="/realtime-attendance" element={<RealtimeAttendance />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/schedule-manager" element={<ScheduleManager />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/course-enrollments" element={<Courses />} />
      </Routes>
    </>
  );
};

export default App;
