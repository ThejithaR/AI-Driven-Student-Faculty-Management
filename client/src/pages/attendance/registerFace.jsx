import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { registerFace } from "../../context/attendaceApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaUpload, FaCamera, FaHome } from "react-icons/fa"; // Added icons for better UI

const RegisterFace = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("upload");
  const [imageSrc, setImageSrc] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regNumber, setRegNumber] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  // Camera capture function
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImageSrc(imageSrc);
  }, [webcamRef]);

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    processFile(file);
  };

  // Process the file to get base64
  const processFile = (file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Submit face registration
  const handleSubmit = async () => {
    if (!imageSrc) {
      toast.error("Please capture or upload an image first");
      return;
    }

    if (!regNumber) {
      toast.error("Please enter your registration number");
      return;
    }

    try {
      setIsSubmitting(true);

      // Extract base64 data
      const base64Data = imageSrc;

      const response = await registerFace(regNumber, base64Data);

      if (response.success) {
        toast.success("Face registered successfully!");
        setImageSrc(null);
        setRegNumber("");
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset captured image
  const resetImage = () => {
    setImageSrc(null);
  };

  // Camera constraints
  const videoConstraints = {
    width: 500,
    height: 500,
    facingMode: "user",
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-6 sm:px-0 bg-gradient-to-r from-gray-200 via-gray-400 to-gray-600">
      {/* Home button */}
      <div
        onClick={() => navigate("/attendance")}
        className="absolute left-5 sm:left-20 top-5 flex items-center cursor-pointer bg-slate-800 p-2 rounded-full hover:bg-slate-700 transition-all"
      >
        <FaHome className="text-white w-6 h-6" />
      </div>

      <div className="bg-slate-900 p-8 rounded-lg shadow-lg w-full max-w-4xl text-indigo-300 text-sm my-10">
        <h2 className="text-3xl font-semibold text-white text-center mb-6">
          Register Your Face
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column: Form and Instructions */}
          <div className="flex flex-col gap-4">
            {/* Registration Number Input */}
            <div className="mb-2">
              <label className="block text-white mb-2">
                Registration Number
              </label>
              <input
                type="text"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                className="w-full p-2.5 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-indigo-500 focus:outline-none"
                placeholder="Enter your registration number"
                required
              />
            </div>

            {/* Mode selection */}
            <div className="flex justify-center gap-4 mb-3">
              <button
                onClick={() => {
                  setMode("upload");
                  setImageSrc(null);
                }}
                className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                  mode === "upload" ? "bg-indigo-600 text-white" : "bg-gray-700"
                }`}
              >
                <FaUpload /> Upload Image
              </button>
              <button
                onClick={() => {
                  setMode("camera");
                  setImageSrc(null);
                }}
                className={`px-4 py-2 rounded-full flex items-center gap-2 ${
                  mode === "camera" ? "bg-indigo-600 text-white" : "bg-gray-700"
                }`}
              >
                <FaCamera /> Use Camera
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-[#333A5C] p-4 rounded-lg mt-2">
              <h3 className="text-white font-medium mb-2">Instructions:</h3>
              <ul className="list-disc pl-5 text-indigo-200 text-sm space-y-2">
                <li>Make sure your face is clearly visible and well-lit</li>
                <li>Remove glasses, hats, or anything covering your face</li>
                <li>Only one face should be visible in the image</li>
                <li>Look directly at the camera for best results</li>
                {mode === "upload" && (
                  <li>You can drag and drop your image into the upload area</li>
                )}
              </ul>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!imageSrc || !regNumber || isSubmitting}
              className={`w-full py-3 mt-4 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium ${
                !imageSrc || !regNumber || isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:shadow-lg hover:from-indigo-600 hover:to-indigo-800 transition-all"
              }`}
            >
              {isSubmitting ? "Registering..." : "Register Face"}
            </button>
          </div>

          {/* Right column: Image capture/upload area */}
          <div className="flex flex-col items-center gap-4">
            {mode === "camera" ? (
              <>
                <div className="relative w-full aspect-square max-h-80 sm:max-h-full overflow-hidden rounded-lg">
                  {!imageSrc ? (
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      className="rounded-lg w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={imageSrc}
                      alt="Captured"
                      className="rounded-lg w-full h-full object-cover border-2 border-green-400"
                    />
                  )}
                </div>
                <div className="flex gap-4 mt-2">
                  <button
                    onClick={imageSrc ? resetImage : capture}
                    className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    {imageSrc ? "Retake Photo" : "Capture"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  ref={dropAreaRef}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`w-full aspect-square max-h-80 sm:max-h-full 
                    border-2 ${
                      isDragging
                        ? "border-indigo-500 bg-slate-800"
                        : "border-dashed border-gray-500"
                    } 
                    rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all
                    hover:border-indigo-400 hover:bg-slate-800/50`}
                  onClick={() => fileInputRef.current.click()}
                >
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt="Uploaded"
                      className="h-full w-full object-contain rounded-lg"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-300 mb-2 font-medium">
                        Click or drag image here
                      </p>
                      <p className="text-gray-500 text-xs">
                        Supports: JPG, PNG, JPEG
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    {imageSrc ? "Change Image" : "Select Image"}
                  </button>
                  {imageSrc && (
                    <button
                      onClick={resetImage}
                      className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterFace;
