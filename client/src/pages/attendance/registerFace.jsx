import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { registerFace } from "../../context/attendaceApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Upload,
  Camera,
  UserCheck,
  AlertTriangle,
  Info,
  Check,
  X,
  RotateCcw,
  Image,
  User,
  Shield,
} from "lucide-react";

const RegisterFace = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState("upload");
  const [imageSrc, setImageSrc] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regNumber, setRegNumber] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [captureCountdown, setCaptureCountdown] = useState(null);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  // Camera capture function with countdown
  const startCaptureCountdown = useCallback(() => {
    setCaptureCountdown(3);

    // Start countdown
    const countdownInterval = setInterval(() => {
      setCaptureCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // Capture the image after countdown ends
          const imageSrc = webcamRef.current.getScreenshot();
          setImageSrc(imageSrc);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
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
            <UserCheck className="hidden sm:inline w-6 h-6" />
            Face Registration
          </h1>
        </div>
      </header>

      <main className="container mx-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left column: Image Capture Area */}
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-bold mb-6 self-start flex items-center gap-2">
                  <Camera className="text-indigo-400" />
                  {mode === "camera"
                    ? "Capture Your Face"
                    : "Upload Your Photo"}
                </h2>

                {/* Mode selection */}
                <div className="flex w-full bg-slate-900/50 p-1 rounded-xl mb-6">
                  <button
                    onClick={() => {
                      setMode("upload");
                      setImageSrc(null);
                    }}
                    className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
                      mode === "upload"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload</span>
                  </button>
                  <button
                    onClick={() => {
                      setMode("camera");
                      setImageSrc(null);
                    }}
                    className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
                      mode === "camera"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Camera</span>
                  </button>
                </div>

                {/* Image display area */}
                <div className="w-full">
                  {mode === "camera" ? (
                    <div className="relative w-full aspect-square max-w-md mx-auto overflow-hidden rounded-2xl border-2 border-slate-700 shadow-lg bg-slate-900">
                      {!imageSrc ? (
                        <>
                          <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={videoConstraints}
                            className="rounded-xl w-full h-full object-cover"
                          />

                          {/* Face outline guide */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-3/5 h-3/4 border-4 border-dashed border-indigo-500/50 rounded-full"></div>
                          </div>

                          {/* Countdown overlay */}
                          {captureCountdown && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                              <div className="text-7xl font-bold text-white animate-pulse">
                                {captureCountdown}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="relative">
                          <img
                            src={imageSrc}
                            alt="Captured"
                            className="rounded-xl w-full h-full object-cover"
                          />
                          <div className="absolute top-3 right-3 bg-green-900/80 text-green-300 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            Captured
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      ref={dropAreaRef}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={`w-full aspect-square max-w-md mx-auto 
                        border-2 ${
                          isDragging
                            ? "border-indigo-500 bg-indigo-900/20"
                            : imageSrc
                            ? "border-indigo-600"
                            : "border-dashed border-slate-700"
                        } 
                        rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all
                        hover:border-indigo-400 bg-slate-900/70`}
                      onClick={() => fileInputRef.current.click()}
                    >
                      {imageSrc ? (
                        <div className="relative w-full h-full">
                          <img
                            src={imageSrc}
                            alt="Uploaded"
                            className="h-full w-full object-cover rounded-xl"
                          />
                          <div className="absolute top-3 right-3 bg-green-900/80 text-green-300 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5">
                            <Check className="w-4 h-4" />
                            Uploaded
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-4">
                          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="h-10 w-10 text-indigo-400" />
                          </div>
                          <p className="text-white mb-3 text-lg font-medium">
                            Click or drag image here
                          </p>
                          <p className="text-slate-400 text-sm max-w-xs mx-auto">
                            Upload a clear photo of your face for registration.
                            The image should show your face clearly.
                          </p>
                          <p className="mt-4 text-indigo-300 text-xs">
                            Supports: JPG, PNG, JPEG
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Camera/Upload controls */}
                  <div className="flex justify-center gap-4 mt-6">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {mode === "camera" ? (
                      !imageSrc ? (
                        <button
                          onClick={startCaptureCountdown}
                          disabled={captureCountdown !== null}
                          className={`px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-colors shadow-md ${
                            captureCountdown !== null
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <Camera className="w-4 h-4" />
                          <span>
                            {captureCountdown
                              ? `Capturing in ${captureCountdown}...`
                              : "Capture Photo"}
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={resetImage}
                          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center gap-2 transition-colors shadow-md"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span>Retake Photo</span>
                        </button>
                      )
                    ) : (
                      <>
                        <button
                          onClick={() => fileInputRef.current.click()}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 transition-colors shadow-md"
                        >
                          <Image className="w-4 h-4" />
                          <span>
                            {imageSrc ? "Change Image" : "Select Image"}
                          </span>
                        </button>

                        {imageSrc && (
                          <button
                            onClick={resetImage}
                            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-2 transition-colors shadow-md"
                          >
                            <X className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column: Registration form */}
              <div className="flex flex-col">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <User className="text-indigo-400" />
                  Registration Details
                </h2>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-indigo-300 mb-1.5">
                    Registration Number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      className="w-full p-3 pl-10 rounded-xl bg-slate-900/70 text-white border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                      placeholder="Enter your registration number"
                      required
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="text-slate-500" />
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-indigo-900/30 border border-indigo-800/50 rounded-xl p-5 mb-6">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <Info className="text-indigo-400" />
                    Registration Instructions
                  </h3>
                  <ul className="space-y-2.5 text-indigo-200 text-sm">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>
                        Make sure your face is clearly visible and well-lit
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <span>
                        Remove glasses, hats, or anything covering your face
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Only one face should be visible in the image</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Look directly at the camera for best results</span>
                    </li>
                    {mode === "upload" && (
                      <li className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>
                          You can drag and drop your image into the upload area
                        </span>
                      </li>
                    )}
                  </ul>
                </div>

                {/* Privacy Notice */}
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="text-indigo-400 w-5 h-5" />
                    <p>
                      Your face data will be securely stored and only used for
                      attendance verification purposes.
                    </p>
                  </div>
                </div>

                {/* Register button */}
                <button
                  onClick={handleSubmit}
                  disabled={!imageSrc || !regNumber || isSubmitting}
                  className={`w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 mt-auto shadow-md transition-all ${
                    !imageSrc || !regNumber || isSubmitting
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
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      <span>Register Your Face</span>
                    </>
                  )}
                </button>

                {/* Registration status */}
                <div className="mt-4 text-center text-sm text-slate-400">
                  {!imageSrc && !regNumber ? (
                    <p>
                      Provide your photo and registration number to continue
                    </p>
                  ) : !imageSrc ? (
                    <p>Please select or capture your photo</p>
                  ) : !regNumber ? (
                    <p>Please enter your registration number</p>
                  ) : (
                    <p className="text-green-400 flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Ready to register
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterFace;
