import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { markManualAttendance } from "../../context/attendaceApi";
import {
  ChevronLeft,
  BookOpen,
  MapPin,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  ChevronsUp,
  Info,
  Clock,
} from "lucide-react";

const ManualAttendance = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    reg_number: "",
    status: "present", // Default status
    location: "",
    course_code: "",
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [showSubmissionHistory, setShowSubmissionHistory] = useState(false);

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

        // Add to recent submissions
        const submission = {
          ...formData,
          timestamp: new Date().toLocaleTimeString(),
          date: new Date().toLocaleDateString(),
          id: Date.now(),
          status: formData.status.toUpperCase(),
        };

        setRecentSubmissions((prev) => [submission, ...prev].slice(0, 10));

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

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case "present":
        return "bg-green-900/40 text-green-300 border border-green-700";
      case "absent":
        return "bg-red-900/40 text-red-300 border border-red-700";
      case "late":
        return "bg-yellow-900/40 text-yellow-300 border border-yellow-700";
      case "excused":
        return "bg-blue-900/40 text-blue-300 border border-blue-700";
      default:
        return "bg-gray-900/40 text-gray-300 border border-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white">
      {/* Header with back button */}
      <header className="bg-gradient-to-r from-indigo-900 to-purple-900 p-4 sm:p-6 shadow-lg">
        <div className="container mx-auto flex items-center">
          <button
            onClick={() => navigate("/attendance")}
            className="mr-4 bg-indigo-700/50 hover:bg-indigo-700/80 p-2 rounded-full transition-all duration-300"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <ClipboardCheck className="hidden sm:inline w-6 h-6" />
            Manual Attendance Entry
          </h1>
        </div>
      </header>

      <main className="container mx-auto p-6 md:p-8 flex flex-col md:flex-row gap-6">
        {/* Form Section */}
        <div className="w-full md:w-1/2 lg:w-2/5">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ClipboardCheck className="text-indigo-400" />
                Record Student Attendance
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Registration Number */}
                <div>
                  <label
                    htmlFor="reg_number"
                    className="block text-sm font-medium text-indigo-300 mb-1.5"
                  >
                    Registration Number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="reg_number"
                      name="reg_number"
                      value={formData.reg_number}
                      onChange={handleChange}
                      className="w-full p-3 pl-10 rounded-xl bg-slate-900/70 text-white border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                      placeholder="Enter student ID"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ClipboardCheck className="text-slate-500" />
                    </div>
                  </div>
                </div>

                {/* Course Code */}
                <div>
                  <label
                    htmlFor="course_code"
                    className="block text-sm font-medium text-indigo-300 mb-1.5"
                  >
                    Course Code <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="course_code"
                      name="course_code"
                      value={formData.course_code}
                      onChange={handleChange}
                      className="w-full p-3 pl-10 rounded-xl bg-slate-900/70 text-white border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                      placeholder="Enter course code"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BookOpen className="text-slate-500" />
                    </div>
                  </div>
                </div>

                {/* Status Selection */}
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-indigo-300 mb-1.5"
                  >
                    Attendance Status
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {["present", "absent", "late", "excused"].map((status) => (
                      <label
                        key={status}
                        className={`flex items-center justify-center p-3 rounded-xl cursor-pointer transition-all ${
                          formData.status === status
                            ? "bg-indigo-600/50 border border-indigo-500"
                            : "bg-slate-900/70 border border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          checked={formData.status === status}
                          onChange={handleChange}
                          className="hidden"
                        />
                        <span className="capitalize text-sm">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-indigo-300 mb-1.5"
                  >
                    Location (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      className="w-full p-3 pl-10 rounded-xl bg-slate-900/70 text-white border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                      placeholder="Enter location"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="text-slate-500" />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 shadow-md transition-all ${
                    isSubmitting
                      ? "bg-indigo-700/60 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle />
                      <span>Mark Attendance</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Information Box */}
          <div className="mt-6 bg-indigo-900/30 border border-indigo-800/50 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Info className="text-indigo-400" />
              Attendance Information
            </h3>
            <ul className="space-y-2.5 text-indigo-200 text-sm">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>
                  Ensure the registration number is correct before submission
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>
                  Select the appropriate attendance status for accurate records
                </span>
              </li>
              <li className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Course code is required for proper record keeping</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span>
                  Location is optional but recommended for better tracking
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Recent Submissions Section */}
        <div className="w-full md:w-1/2 lg:w-3/5">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-lg h-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Clock className="text-indigo-400" />
                  Recent Attendance Records
                </h2>
                {recentSubmissions.length > 0 && (
                  <button
                    onClick={() => setShowSubmissionHistory((prev) => !prev)}
                    className="flex items-center gap-1 text-sm text-indigo-300 hover:text-indigo-200 transition-colors"
                  >
                    <ChevronsUp
                      className={`w-4 h-4 transition-transform ${
                        showSubmissionHistory ? "rotate-180" : ""
                      }`}
                    />
                    {showSubmissionHistory ? "Hide" : "Show All"}
                  </button>
                )}
              </div>

              {recentSubmissions.length > 0 ? (
                <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                  {recentSubmissions
                    .slice(0, showSubmissionHistory ? undefined : 3)
                    .map((submission) => (
                      <div
                        key={submission.id}
                        className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center">
                              <ClipboardCheck className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {submission.reg_number}
                              </h3>
                              <p className="text-sm text-slate-400">
                                {submission.course_code}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                              submission.status
                            )}`}
                          >
                            {submission.status}
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{submission.timestamp}</span>
                          </div>
                          {submission.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{submission.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <ClipboardCheck className="w-12 h-12 mb-4 opacity-30" />
                  <p>No attendance records yet</p>
                  <p className="text-sm mt-2">
                    Records will appear here after submission
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManualAttendance;
