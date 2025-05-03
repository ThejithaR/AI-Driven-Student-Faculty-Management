import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaHome,
  FaVideo,
  FaStop,
  FaCheckCircle,
  FaExclamationTriangle,
  FaUniversity,
  FaMapMarkerAlt,
} from "react-icons/fa";

// Constants
const WS_URL = "ws://localhost:8000/realtime/face-recognition";
const FRAME_INTERVAL = 500; // Process frames every 200ms

const ImprovedRealTimeAttendance = () => {
  const navigate = useNavigate();

  // State management
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [openCvLoaded, setOpenCvLoaded] = useState(false);
  const [faceCascadeLoaded, setFaceCascadeLoaded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [attendanceResults, setAttendanceResults] = useState([]);
  const [stats, setStats] = useState({
    totalFaces: 0,
    recognized: 0,
    unknown: 0,
  });
  const [formData, setFormData] = useState({
    threshold: 0.6,
    location: "",
    course_code: "",
  });

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);
  const processingIntervalRef = useRef(null);
  const faceCascadeRef = useRef(null);
  const frameCountRef = useRef(0);
  const sendIntervalRef = useRef(3); // Send every 3rd processed frame

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Load OpenCV.js
  useEffect(() => {
    // Check if OpenCV is already loaded
    if (window.cv && window.cv.Mat) {
      setOpenCvLoaded(true);
      return;
    }

    // Load OpenCV.js script
    const script = document.createElement("script");
    script.src = "/opencv.js"; // Adjust path as needed
    script.async = true;
    script.onload = () => {
      // Set up OpenCV module
      window.Module = {
        onRuntimeInitialized: () => {
          console.log("OpenCV.js loaded");
          setOpenCvLoaded(true);
          toast.success("OpenCV.js loaded successfully");
        },
      };
    };
    script.onerror = () => {
      console.error("Failed to load OpenCV.js");
      toast.error("Failed to load OpenCV.js. Face detection will be disabled.");
    };

    document.body.appendChild(script);

    // Clean up
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Load face cascade file
  const loadFaceCascade = useCallback(async () => {
    if (!window.cv || !openCvLoaded) return;

    try {
      toast.info("Loading face detection model...");

      // Face cascade file path
      const faceCascadePath = "haarcascade_frontalface_default.xml";

      // Fetch the cascade file
      const response = await fetch(faceCascadePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch cascade file: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      const data = new Uint8Array(buffer);

      // Create file in memory
      window.cv.FS_createDataFile(
        "/",
        faceCascadePath,
        data,
        true,
        false,
        false
      );

      // Load the cascade classifier
      const faceCascade = new window.cv.CascadeClassifier();
      faceCascade.load(faceCascadePath);

      if (faceCascade.empty()) {
        throw new Error("Failed to load cascade classifier");
      }

      faceCascadeRef.current = faceCascade;
      setFaceCascadeLoaded(true);
      toast.success("Face detection model loaded");
    } catch (error) {
      console.error("Error loading face cascade:", error);
      toast.error(`Failed to load face detection: ${error.message}`);
    }
  }, [openCvLoaded]);

  // Load face cascade when OpenCV is ready
  useEffect(() => {
    if (openCvLoaded) {
      loadFaceCascade();
    }
  }, [openCvLoaded, loadFaceCascade]);

  // Initialize video stream
  const startVideoStream = useCallback(async () => {
    setIsConnecting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      // Wait for video to load metadata before starting
      videoRef.current.onloadedmetadata = () => {
        setIsStreaming(true);
        setIsConnecting(false);
        toast.success("Camera started successfully");
      };
    } catch (err) {
      console.error("Camera access error:", err);
      setIsConnecting(false);

      // Provide more specific error messages based on error type
      if (err.name === "NotAllowedError") {
        toast.error(
          "Camera access denied. Please allow camera permissions and try again."
        );
      } else if (err.name === "NotFoundError") {
        toast.error("No camera found. Please connect a camera and try again.");
      } else {
        toast.error(`Camera error: ${err.message}`);
      }
    }
  }, []);

  // Stop video stream
  const stopVideoStream = useCallback(() => {
    // Clear processing interval
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }

    // Clean up stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Reset video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Close websocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Reset states
    setIsStreaming(false);
    setConnectionStatus("disconnected");

    toast.info("Processing stopped");
  }, []);

  // Process video frame
  const processVideoFrame = useCallback(() => {
    if (!isStreaming || !videoRef.current || !canvasRef.current) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Only process if video is actually playing
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Perform face detection if OpenCV and cascade are loaded
      if (
        window.cv &&
        faceCascadeRef.current &&
        !faceCascadeRef.current.empty()
      ) {
        try {
          // Get image data from canvas
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Convert to OpenCV format
          const src = window.cv.matFromImageData(imageData);
          const gray = new window.cv.Mat();

          // Convert to grayscale
          window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);

          // Detect faces
          const faces = new window.cv.RectVector();
          faceCascadeRef.current.detectMultiScale(gray, faces, 1.1, 3, 0);

          // Draw rectangles around faces
          for (let i = 0; i < faces.size(); ++i) {
            const face = faces.get(i);
            ctx.strokeStyle = "#00ff00";
            ctx.lineWidth = 2;
            ctx.strokeRect(face.x, face.y, face.width, face.height);

            // Add confidence label
            ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
            ctx.fillRect(face.x, face.y - 20, 70, 20);
            ctx.fillStyle = "#000000";
            ctx.font = "12px Arial";
            ctx.fillText("Face", face.x + 5, face.y - 5);
          }

          // Clean up resources
          src.delete();
          gray.delete();
          faces.delete();
        } catch (e) {
          console.error("Face detection error:", e);
        }
      }

      // Send frame via WebSocket if connected
      frameCountRef.current++;
      if (
        frameCountRef.current % sendIntervalRef.current === 0 &&
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        // Get image data as base64
        const imageData = canvas.toDataURL("image/jpeg", 0.75);
        const base64Data = imageData.split(",")[1];

        wsRef.current.send(
          JSON.stringify({
            image_base64: base64Data,
            threshold: parseFloat(formData.threshold),
            location: formData.location,
            course_code: formData.course_code,
          })
        );
      }
    } catch (err) {
      console.error("Error processing video frame:", err);
    }
  }, [isStreaming, formData]);

  // Initialize WebSocket connection
  const initWebSocket = useCallback(() => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    setConnectionStatus("connecting");

    wsRef.current = new WebSocket(WS_URL);

    wsRef.current.onopen = () => {
      setConnectionStatus("connected");
      toast.success("Connected to recognition service");
      console.log("WebSocket connection established");
    };

    wsRef.current.onclose = (event) => {
      console.log("WebSocket closed:", event);
      setConnectionStatus("disconnected");

      // Only show disconnect message if we were streaming
      if (isStreaming) {
        toast.warning("Disconnected from recognition service");
        stopVideoStream();
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("error");
      toast.error("Connection error. Please try again later.");
      stopVideoStream();
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (!data.success) {
          console.warn("Backend processing error:", data.message);
          // Reset counts when no faces detected
          setStats({
            totalFaces: 0,
            recognized: 0,
            unknown: 0,
          });
          return;
        }

        // Update attendance results only if we have actual detections
        if (data.total_faces_detected > 0) {
          if (data.attendance_results?.length > 0) {
            setAttendanceResults((prev) =>
              [...data.attendance_results, ...prev].slice(0, 10)
            );
          }

          setStats({
            totalFaces: data.total_faces_detected,
            recognized: data.recognized_count,
            unknown: data.unknown_count,
          });
        } else {
          // Reset when no faces detected
          setStats({
            totalFaces: 0,
            recognized: 0,
            unknown: 0,
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };
  }, [isStreaming, stopVideoStream]);

  // Start/stop real-time processing
  const toggleProcessing = () => {
    if (isStreaming) {
      stopVideoStream();
    } else {
      // Form validation
      if (!formData.course_code.trim()) {
        toast.error("Course code is required");
        return;
      }

      startVideoStream();
      initWebSocket();
    }
  };

  // Set up processing interval when streaming starts
  useEffect(() => {
    if (isStreaming) {
      // Start processing frames at regular intervals
      processingIntervalRef.current = setInterval(
        processVideoFrame,
        FRAME_INTERVAL
      );
    }

    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [isStreaming, processVideoFrame]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopVideoStream();

      // Clean up OpenCV resources
      if (faceCascadeRef.current) {
        faceCascadeRef.current.delete();
        faceCascadeRef.current = null;
      }
    };
  }, [stopVideoStream]);

  // Generate connection status indicator color
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-600";
      case "connecting":
        return "bg-yellow-600";
      case "error":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-6 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
      {/* Navigation button */}
      <button
        onClick={() => navigate("/")}
        className="fixed left-4 top-4 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 p-3 rounded-full shadow-lg transition-all z-10"
        aria-label="Go home"
      >
        <FaHome className="text-white w-5 h-5" />
      </button>

      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl text-gray-100 overflow-hidden">
        {/* Header section */}
        <div className="bg-gradient-to-r from-indigo-800 to-purple-800 p-6 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Real-Time Attendance System
          </h1>

          {/* Connection status indicator */}
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${getConnectionStatusColor()}`}
            ></div>
            <span className="text-sm hidden sm:inline-block">
              {connectionStatus === "connected"
                ? "Connected"
                : connectionStatus === "connecting"
                ? "Connecting..."
                : connectionStatus === "error"
                ? "Connection Error"
                : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Camera and controls section */}
          <div className="space-y-5">
            <div className="bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-700">
              {/* Video container with aspect ratio */}
              <div className="relative pt-[75%]">
                {" "}
                {/* 4:3 aspect ratio */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ display: isStreaming ? "block" : "none" }}
                />
                {/* Canvas overlay for drawing face boxes */}
                <canvas
                  ref={canvasRef}
                  className={`absolute inset-0 w-full h-full object-cover ${
                    isStreaming ? "" : "hidden"
                  }`}
                />
                {/* Placeholder when not streaming */}
                {!isStreaming && !isConnecting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400">
                    <FaVideo className="w-12 h-12 mb-4 opacity-40" />
                    <p>Camera feed will appear here</p>
                    {!openCvLoaded && (
                      <p className="mt-2 text-yellow-400">
                        Loading OpenCV.js...
                      </p>
                    )}
                    {openCvLoaded && !faceCascadeLoaded && (
                      <p className="mt-2 text-yellow-400">
                        Loading face detection model...
                      </p>
                    )}
                  </div>
                )}
                {/* Loading indicator */}
                {isConnecting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                    <p className="text-indigo-300">Connecting to camera...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={toggleProcessing}
              disabled={isConnecting || !openCvLoaded}
              className={`w-full py-4 rounded-xl flex items-center justify-center font-semibold text-lg shadow-lg transition duration-200 ${
                isConnecting || !openCvLoaded
                  ? "bg-gray-600 cursor-not-allowed"
                  : isStreaming
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isConnecting ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Connecting...
                </span>
              ) : !openCvLoaded ? (
                <>
                  <FaVideo className="mr-2" />
                  Loading Face Detection...
                </>
              ) : isStreaming ? (
                <>
                  <FaStop className="mr-2" />
                  Stop Attendance Tracking
                </>
              ) : (
                <>
                  <FaVideo className="mr-2" />
                  Start Attendance Tracking
                </>
              )}
            </button>
          </div>

          {/* Controls and Results section */}
          <div className="space-y-5">
            {/* Settings panel */}
            <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                <FaUniversity className="mr-2 text-indigo-400" />
                Session Settings
              </h2>

              {/* Course code input */}
              <div className="mb-4">
                <label
                  htmlFor="course_code"
                  className="block text-sm font-medium text-indigo-300 mb-1"
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
                    className="w-full p-3 pl-10 rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                    placeholder="E.g. CS101"
                    required
                    disabled={isStreaming}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUniversity className="text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Location input */}
              <div className="mb-4">
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-indigo-300 mb-1"
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
                    className="w-full p-3 pl-10 rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition"
                    placeholder="E.g. Room 204"
                    disabled={isStreaming}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Threshold slider */}
              <div>
                <label
                  htmlFor="threshold"
                  className="flex justify-between text-sm font-medium text-indigo-300 mb-1"
                >
                  <span>Recognition Threshold</span>
                  <span className="font-mono bg-slate-700 px-2 py-0.5 rounded text-xs">
                    {formData.threshold}
                  </span>
                </label>
                <input
                  type="range"
                  id="threshold"
                  name="threshold"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={formData.threshold}
                  onChange={handleChange}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  disabled={isStreaming}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Less strict (0.1)</span>
                  <span>More strict (0.9)</span>
                </div>
              </div>
            </div>

            {/* Stats panel */}
            <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
                <FaCheckCircle className="mr-2 text-green-400" />
                Recognition Stats
              </h2>

              <div className="grid grid-cols-3 gap-4 text-center">
                {/* Face count */}
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-3xl font-bold text-white mb-1">
                    {stats.totalFaces}
                  </div>
                  <div className="text-xs text-slate-400">Total Faces</div>
                </div>

                {/* Recognized count */}
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-3xl font-bold text-green-400 mb-1">
                    {stats.recognized}
                  </div>
                  <div className="text-xs text-slate-400">Recognized</div>
                </div>

                {/* Unknown count */}
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">
                    {stats.unknown}
                  </div>
                  <div className="text-xs text-slate-400">Unknown</div>
                </div>
              </div>
            </div>

            {/* Recent Results panel */}
            <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 max-h-64 overflow-hidden flex flex-col">
              <h2 className="text-xl font-semibold mb-3 text-white flex items-center">
                <FaCheckCircle className="mr-2 text-green-400" />
                Recent Attendance
              </h2>

              {/* Results list with scrolling */}
              <div className="overflow-y-auto flex-grow">
                {attendanceResults.length > 0 ? (
                  <ul className="space-y-2">
                    {attendanceResults.map((result, index) => (
                      <li
                        key={index}
                        className="p-3 bg-slate-800 rounded-lg text-sm flex justify-between items-center border-l-4 border-l-indigo-500"
                      >
                        <span className="font-medium text-white">
                          {result.reg_number}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            result.status === "PRESENT"
                              ? "bg-green-900 text-green-300"
                              : result.status === "LATE"
                              ? "bg-yellow-900 text-yellow-300"
                              : "bg-red-900 text-red-300"
                          }`}
                        >
                          {result.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center justify-center h-36 text-slate-400">
                    <FaExclamationTriangle className="text-3xl mb-2 opacity-30" />
                    <p className="text-center">
                      {isStreaming
                        ? "Waiting for recognition results..."
                        : "Start processing to see attendance results"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImprovedRealTimeAttendance;
