import { useNavigate } from "react-router-dom";
import React from "react";
import { useState } from "react";
import { toast } from "react-toastify";


const services = [
  { name: "User Profiles", path: "/user-profiles", bgClass: "bg-blue-500" },
  { name: "Attendance", path: "/attendance", bgClass: "bg-green-500" },
  { name: "Chatbot", path: "/chatbot", bgClass: "bg-purple-500" },
  { name: "Schedule Manager", path: "/schedule-manager", bgClass: "bg-yellow-500" },
  { name: "Notifications", path: "/notifications", bgClass: "bg-red-500" },
  { name: "Course Enrollments", path: "/course-enrollments", bgClass: "bg-pink-500" },
];


const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-100 to-purple-100 p-8">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-12 drop-shadow-sm">
        🎓 AI-Powered Student & Faculty Management
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {services.map(({ name, path, bgClass }) => (
          <div
            key={name}
            className={`${bgClass}
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


export default Home;
