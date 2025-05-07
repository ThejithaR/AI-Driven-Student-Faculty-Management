import { Routes, Route, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import React from "react";
import Home from "./pages/Home";
import UserProfiles from "./pages/user_profiles/UserProfiles";
import Login from "./pages/user_profiles/Login";
import EditProfile from "./pages/user_profiles/EditProfile";
import ResetPassword from "./pages/user_profiles/ResetPassword";
import Attendance from "./pages/attendance";
import Chatbot from "./pages/chatbot";
import ScheduleManager from "./pages/scheduleManager";
import Notifications from "./pages/notifications";
import CourseEnrollments from "./pages/CoursePage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/user-profiles" element={<UserProfiles />} />
      <Route path="/login" element={<Login />} />
      <Route path="/edit-profile" element={<EditProfile />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/chatbot" element={<Chatbot />} />
      <Route path="/schedule-manager" element={<ScheduleManager />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/course-enrollments" element={<CourseEnrollments />} />
    </Routes>
  );
};

export default App;
