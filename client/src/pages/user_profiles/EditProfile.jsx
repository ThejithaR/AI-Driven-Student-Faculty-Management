import React, { useEffect, useState } from 'react';
import { assets } from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';

const EditProfile = () => {
  const userEmail = localStorage.getItem('userEmail') || "example@gmail.com";  
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [profileData, setProfileData] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [previewPic, setPreviewPic] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${backendUrl}/api/user/get-user/${userEmail}`);
        if (data.success) {
          setProfileData(data.user);
          setDisplayName(data.user.display_name);
          setPhone(data.user.phone);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message);
      }
    };

    if (userEmail) {
      fetchProfile();
    }
  }, [userEmail, backendUrl]);

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreviewPic(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('display_name', displayName);
      formData.append('phone', phone);
      if (profilePic) {
        formData.append('profile_picture', profilePic);
      }

      const { data } = await axios.put(`${backendUrl}/api/user/update-profile/${userEmail}`, formData);
      if (data.success) {
        toast.success('Profile updated successfully!');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600">
      <div className="bg-slate-900 p-10 rounded-lg shadow-lg w-full sm:w-[500px] text-indigo-300 text-sm">
        <h2 className="text-3xl font-semibold text-white text-center mb-5">Edit Profile</h2>

        <form onSubmit={handleSave} className="flex flex-col gap-5">

          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-3">
            <img
              src={previewPic || profileData.profile_picture || assets.default_profile}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
            <label className="text-xs cursor-pointer bg-[#333A5C] py-1.5 px-3 rounded-full">
              Change Picture
              <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicChange} />
            </label>
          </div>

          {/* Display Name */}
          <div className="flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
            <img src={assets.person_icon} alt="" />
            <input
              className="bg-transparent outline-none flex-1 text-white"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display Name"
              required
            />
          </div>

          {/* Phone Number */}
          <div className="flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]">
            <img src={assets.phone_icon} alt="" />
            <input
              className="bg-transparent outline-none flex-1 text-white"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone Number"
              required
            />
          </div>

          {/* Read-Only Fields */}
          {[
            { label: 'Email', value: profileData.email },
            { label: 'Registration Number', value: profileData.reg_number },
            { label: 'Faculty', value: profileData.faculty },
            { label: 'Department', value: profileData.department },
            ...(profileData.role === 'student'
              ? [
                  { label: 'Year', value: profileData.year || 'N/A' },
                  { label: 'Semester', value: profileData.semester || 'N/A' },
                ]
              : [])
          ].map((field, index) => (
            <div
              key={index}
              className="flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C] opacity-70 cursor-not-allowed"
            >
              <input
                className="bg-transparent outline-none flex-1 text-white"
                type="text"
                value={field.value}
                disabled
              />
            </div>
          ))}

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium"
          >
            Save Changes
          </button>

        </form>
      </div>
    </div>
  );
};

export default EditProfile;
