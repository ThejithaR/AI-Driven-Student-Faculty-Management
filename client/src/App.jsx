import { Routes, Route, useNavigate } from "react-router-dom";
import UserProfiles from "./pages/userProfiles";
import Attendance from "./pages/attendance";
import Chatbot from "./pages/chatbot";
import ScheduleManager from "./pages/scheduleManager";
import Notifications from "./pages/notifications";
import CourseEnrollments from "./pages/courseEnrollments";

const services = [
  { name: "User Profiles", path: "/user-profiles", color: "bg-blue-500" },
  { name: "Attendance", path: "/attendance", color: "bg-green-500" },
  { name: "Chatbot", path: "/chatbot", color: "bg-purple-500" },
  { name: "Schedule Manager", path: "/schedule-manager", color: "bg-yellow-500" },
  { name: "Notifications", path: "/notifications", color: "bg-red-500" },
  { name: "Course Enrollments", path: "/course-enrollments", color: "bg-pink-500" },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-100 to-purple-100 p-8">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-12 drop-shadow-sm">
        🎓 AI-Powered Student & Faculty Management
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {services.map(({ name, path, color }) => (
          <div
            key={name}
            className={`
              ${color} bg-opacity-80 
              rounded-2xl shadow-xl backdrop-blur-md 
              text-white p-6 cursor-pointer 
              hover:scale-105 hover:shadow-2xl transition-transform duration-300 ease-in-out
            `}
            onClick={() => navigate(path)}
          >
            <h2 className="text-2xl font-semibold drop-shadow-md">{name}</h2>
            <p className="mt-2 text-sm drop-shadow-sm">Access the {name} module</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/user-profiles" element={<UserProfiles />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/chatbot" element={<Chatbot />} />
      <Route path="/schedule-manager" element={<ScheduleManager />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/course-enrollments" element={<CourseEnrollments />} />
    </Routes>
  );
};

export default App;
