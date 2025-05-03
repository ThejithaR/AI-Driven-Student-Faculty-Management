import React from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets"; // adjust path if needed
import { FaUserCheck, FaCamera, FaClipboardList } from "react-icons/fa"; // Using react-icons for consistency

const RegisterFace = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Manual Attendance",
      description: "Mark attendance manually for individuals or groups.",
      route: "/manual-attendance",
      icon: <FaClipboardList className="w-12 h-12 mb-4 text-blue-400" />,
    },
    {
      title: "Real-time Attendance",
      description: "Use facial recognition for automatic attendance tracking.",
      route: "/realtime-attendance",
      icon: <FaCamera className="w-12 h-12 mb-4 text-green-400" />,
    },
    {
      title: "Register Face",
      description: "Add new faces to the recognition system.",
      route: "/register-face",
      icon: <FaUserCheck className="w-12 h-12 mb-4 text-purple-400" />,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600">
      <img
        onClick={() => navigate("/")}
        src={assets.home}
        alt="Logo"
        className="absolute left-5 sm:left-20 top-5 w-10 sm:w-10 cursor-pointer"
      />
      <h2 className="text-3xl font-semibold text-white mb-8">
        Attendance Management
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full sm:w-3/4">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.route)}
            className="bg-slate-900 p-8 rounded-lg shadow-lg flex flex-col items-center text-center text-indigo-300 hover:scale-105 transition-transform cursor-pointer hover:shadow-xl hover:bg-slate-800"
          >
            {card.icon}
            <h3 className="text-xl font-semibold text-white mb-2">
              {card.title}
            </h3>
            <p className="text-sm">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RegisterFace;
