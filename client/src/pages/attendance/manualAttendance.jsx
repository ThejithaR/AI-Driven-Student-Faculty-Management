import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { markManualAttendance } from "../../context/attendaceApi";
import { FaHome, FaCheck, FaSave } from "react-icons/fa";

const ManualAttendance = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reg_number: "",
    status: "present", // Default status
    location: "",
    course_code: "",
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit attendance data
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.reg_number) {
      toast.error("Registration number is required");
      return;
    }

    if (!formData.course_code) {
      toast.error("Course code is required");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await markManualAttendance(
        formData.reg_number,
        formData.status,
        formData.location,
        formData.course_code
      );

      if (response.success) {
        toast.success(response.message);
        // Reset form after successful submission
        setFormData({
          reg_number: "",
          status: "present",
          location: "",
          course_code: "",
        });
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to mark attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600">
      {/* Home button */}
      <div
        onClick={() => navigate("/")}
        className="absolute left-5 sm:left-20 top-5 flex items-center cursor-pointer bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition-all"
      >
        <FaHome className="text-white w-6 h-6" />
      </div>

      <div className="bg-slate-900 p-8 rounded-lg shadow-lg w-full max-w-2xl text-indigo-300 text-sm my-10">
        <h2 className="text-3xl font-semibold text-white text-center mb-6">
          Manual Attendance
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Registration Number */}
          <div className="mb-4">
            <label htmlFor="reg_number" className="block text-white mb-2">
              Registration Number
            </label>
            <input
              type="text"
              id="reg_number"
              name="reg_number"
              value={formData.reg_number}
              onChange={handleChange}
              className="w-full p-2.5 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-indigo-500 focus:outline-none"
              placeholder="Enter student registration number"
              required
            />
          </div>

          {/* Course Code */}
          <div className="mb-4">
            <label htmlFor="course_code" className="block text-white mb-2">
              Course Code
            </label>
            <input
              type="text"
              id="course_code"
              name="course_code"
              value={formData.course_code}
              onChange={handleChange}
              className="w-full p-2.5 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-indigo-500 focus:outline-none"
              placeholder="Enter course code"
              required
            />
          </div>

          {/* Status Selection */}
          <div className="mb-4">
            <label htmlFor="status" className="block text-white mb-2">
              Attendance Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2.5 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-indigo-500 focus:outline-none"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>

          {/* Location (Optional) */}
          <div className="mb-4">
            <label htmlFor="location" className="block text-white mb-2">
              Location (Optional)
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2.5 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-indigo-500 focus:outline-none"
              placeholder="Enter location (e.g., Room 101)"
            />
          </div>

          {/* Information Box */}
          <div className="bg-[#333A5C] p-4 rounded-lg">
            <h3 className="text-white font-medium mb-2 flex items-center">
              <FaCheck className="mr-2 text-green-400" /> Manual Attendance
              Information
            </h3>
            <ul className="list-disc pl-5 text-indigo-200 text-sm space-y-2">
              <li>
                Ensure the registration number is correct before submission
              </li>
              <li>Select the appropriate attendance status</li>
              <li>Course code is required for proper record keeping</li>
              <li>Location is optional but recommended for better tracking</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium flex items-center justify-center ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:shadow-lg hover:from-indigo-600 hover:to-indigo-800 transition-all"
            }`}
          >
            <FaSave className="mr-2" />
            {isSubmitting ? "Processing..." : "Mark Attendance"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ManualAttendance;
