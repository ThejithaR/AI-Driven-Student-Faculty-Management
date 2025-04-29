import React from 'react';
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets'; // adjust path if needed

const UserProfiles = () => {
  const navigate = useNavigate();

  const cards = [
    { title: 'Login / Register', description: 'Access your account or create a new one.', route: '/login', icon: assets.person_icon },
    { title: 'Edit Profile', description: 'Update your profile information.', route: '/edit-profile', icon: assets.edit_icon || assets.person_icon }, // fallback if no edit icon
    { title: 'Reset Password', description: 'Recover your account password.', route: '/reset-password', icon: assets.lock_icon },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600">
      <img
        onClick={() => navigate('/')}
        src={assets.home}
        alt="Logo"
        className="absolute left-5 sm:left-20 top-5 w-10 sm:w-10 cursor-pointer"
      />
      <h2 className="text-3xl font-semibold text-white mb-8">User Profiles</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full sm:w-3/4">
        {cards.map((card, index) => (
          <div
            key={index}
            onClick={() => navigate(card.route)}
            className="bg-slate-900 p-8 rounded-lg shadow-lg flex flex-col items-center text-center text-indigo-300 hover:scale-105 transition-transform cursor-pointer"
          >
            <img src={card.icon} alt={card.title} className="w-12 h-12 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">{card.title}</h3>
            <p className="text-sm">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserProfiles;
