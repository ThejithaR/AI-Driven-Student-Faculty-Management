import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ChevronLeft,
  Video,
  VideoOff,
  Check,
  AlertTriangle,
  BookOpen,
  MapPin,
  LayoutDashboard,
  Activity,
  ArrowRight,
  Settings,
  Clock,
  Users,
} from "lucide-react";

// Constants
const WS_URL = "ws://localhost:4000/realtime/face-recognition";
const FRAME_INTERVAL = 500; // Process frames every 500ms

const RealTimeAttendance = () => {
  const navigate = useNavigate();

  // State management
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [openCvLoaded, setOpenCvLoaded] = useState(false);
  const [faceCascadeLoaded, setFaceCascadeLoaded] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [attendanceResults, setAttendanceResults] = useState([]);
  const [wsLogs, setWsLogs] = useState([]);
  const [activeTab, setActiveTab] = useState("attendance"); // 'attendance' or 'logs'
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
  const logsEndRef = useRef(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [wsLogs]);

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

        // Add to logs
        addLog("info", "Camera started successfully");
      };
    } catch (err) {
      console.error("Camera access error:", err);
      setIsConnecting(false);

      // Provide more specific error messages based on error type
      if (err.name === "NotAllowedError") {
        const errorMsg =
          "Camera access denied. Please allow camera permissions and try again.";
        toast.error(errorMsg);
        addLog("error", errorMsg);
      } else if (err.name === "NotFoundError") {
        const errorMsg =
          "No camera found. Please connect a camera and try again.";
        toast.error(errorMsg);
        addLog("error", errorMsg);
      } else {
        const errorMsg = `Camera error: ${err.message}`;
        toast.error(errorMsg);
        addLog("error", errorMsg);
      }
    }
  }, []);

  // Add log entry
  const addLog = (type, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setWsLogs((prev) => [
      { type, message, timestamp, data, id: Date.now() },
      ...prev.slice(0, 99), // Keep only 100 most recent logs
    ]);
  };

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

    addLog("info", "Camera and processing stopped");
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

            // Outer glow effect
            ctx.shadowColor = "rgba(0, 255, 128, 0.5)";
            ctx.shadowBlur = 15;

            // Main rectangle
            ctx.strokeStyle = "#00ff88";
            ctx.lineWidth = 2;
            ctx.strokeRect(face.x, face.y, face.width, face.height);

            // Reset shadow for text
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;

            // Add detection label
            const labelWidth = 60;
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(face.x, face.y - 25, labelWidth, 25);

            // Add gradient border to label
            const gradient = ctx.createLinearGradient(
              face.x,
              face.y - 25,
              face.x + labelWidth,
              face.y
            );
            gradient.addColorStop(0, "#00ff88");
            gradient.addColorStop(1, "#0088ff");
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.strokeRect(face.x, face.y - 25, labelWidth, 25);

            // Text
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 12px Inter, Arial";
            ctx.fillText("FACE", face.x + 5, face.y - 10);

            // Corner indicators (for aesthetic purposes)
            const cornerSize = 6;

            // Top-left corner
            ctx.beginPath();
            ctx.moveTo(face.x, face.y + cornerSize);
            ctx.lineTo(face.x, face.y);
            ctx.lineTo(face.x + cornerSize, face.y);
            ctx.strokeStyle = "#00ff88";
            ctx.stroke();

            // Bottom-right corner
            ctx.beginPath();
            ctx.moveTo(face.x + face.width - cornerSize, face.y + face.height);
            ctx.lineTo(face.x + face.width, face.y + face.height);
            ctx.lineTo(face.x + face.width, face.y + face.height - cornerSize);
            ctx.strokeStyle = "#00ff88";
            ctx.stroke();
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

        const payload = {
          image_base64: base64Data,
          threshold: parseFloat(formData.threshold),
          location: formData.location,
          course_code: formData.course_code,
        };

        wsRef.current.send(JSON.stringify(payload));
        addLog("outgoing", "Sent frame for processing", {
          threshold: payload.threshold,
          courseCode: payload.course_code,
          location: payload.location || "Not specified",
          frameSize: Math.round((base64Data.length * 0.75) / 1024) + " KB",
        });
      }
    } catch (err) {
      console.error("Error processing video frame:", err);
      addLog("error", `Frame processing error: ${err.message}`);
    }
  }, [isStreaming, formData]);

  // Initialize WebSocket connection
  const initWebSocket = useCallback(() => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    setConnectionStatus("connecting");
    addLog("info", "Connecting to recognition service...");

    wsRef.current = new WebSocket(WS_URL);

    wsRef.current.onopen = () => {
      setConnectionStatus("connected");
      toast.success("Connected to recognition service");
      addLog("success", "Connected to recognition service");
      console.log("WebSocket connection established");
    };

    wsRef.current.onclose = (event) => {
      console.log("WebSocket closed:", event);
      setConnectionStatus("disconnected");
      addLog(
        "warning",
        `WebSocket closed: ${event.reason || "No reason provided"}`,
        { code: event.code }
      );

      // Only show disconnect message if we were streaming
      if (isStreaming) {
        toast.warning("Disconnected from recognition service");
        stopVideoStream();
      }
    };

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnectionStatus("error");
      addLog("error", "WebSocket connection error");
      toast.error("Connection error. Please try again later.");
      stopVideoStream();
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addLog(
          "incoming",
          data.success
            ? "Received recognition results"
            : "Received error from server",
          data
        );

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
        addLog("error", `Error parsing WebSocket message: ${error.message}`);
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
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Render log entry
  const renderLogEntry = (log) => {
    const getLogColor = () => {
      switch (log.type) {
        case "success":
          return "border-l-green-500 bg-green-950/20";
        case "error":
          return "border-l-red-500 bg-red-950/20";
        case "warning":
          return "border-l-yellow-500 bg-yellow-950/20";
        case "info":
          return "border-l-blue-500 bg-blue-950/20";
        case "incoming":
          return "border-l-indigo-500 bg-indigo-950/20";
        case "outgoing":
          return "border-l-cyan-500 bg-cyan-950/20";
        default:
          return "border-l-gray-500 bg-gray-950/20";
      }
    };

    const getLogIcon = () => {
      switch (log.type) {
        case "success":
          return <Check className="h-4 w-4 text-green-500" />;
        case "error":
          return <AlertTriangle className="h-4 w-4 text-red-500" />;
        case "warning":
          return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        case "info":
          return <Activity className="h-4 w-4 text-blue-500" />;
        case "incoming":
          return <ArrowRight className="h-4 w-4 text-indigo-500" />;
        case "outgoing":
          return <ArrowRight className="h-4 w-4 text-cyan-500 rotate-180" />;
        default:
          return <Activity className="h-4 w-4 text-gray-500" />;
      }
    };

    return (
      <div
        key={log.id}
        className={`border-l-4 p-3 mb-2 rounded-r ${getLogColor()} text-sm`}
      >
        <div className="flex items-center gap-2">
          <span>{getLogIcon()}</span>
          <span className="font-medium text-white/90">{log.message}</span>
          <span className="ml-auto text-xs font-mono opacity-50">
            {log.timestamp}
          </span>
        </div>

        {log.data && (
          <div className="mt-2 pl-6 text-xs opacity-75 font-mono overflow-x-auto">
            {typeof log.data === "object" ? (
              <pre>{JSON.stringify(log.data, null, 2)}</pre>
            ) : (
              log.data
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
      {/* Header with nav button */}
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
            <Video className="hidden sm:inline w-6 h-6" />
            Real-Time Attendance System
          </h1>

          <div className="ml-auto flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${getConnectionStatusColor()} animate-pulse`}
            ></div>
            <span className="hidden sm:inline-block text-sm font-medium">
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
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left column - Video feed (3 columns on large screens) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Video container */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-400">
                    <Video className="w-16 h-16 mb-6 text-indigo-400 opacity-75" />
                    <p className="text-lg mb-2">Camera feed will appear here</p>

                    {!openCvLoaded && (
                      <div className="mt-4 bg-yellow-900/30 border border-yellow-800 text-yellow-300 px-4 py-2 rounded-lg flex items-center">
                        <div className="mr-2 animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
                        <p>Loading OpenCV.js...</p>
                      </div>
                    )}

                    {openCvLoaded && !faceCascadeLoaded && (
                      <div className="mt-4 bg-blue-900/30 border border-blue-800 text-blue-300 px-4 py-2 rounded-lg flex items-center">
                        <div className="mr-2 animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        <p>Loading face detection model...</p>
                      </div>
                    )}
                  </div>
                )}
                {/* Loading indicator */}
                {isConnecting && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90">
                    <div className="relative h-20 w-20 mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin"></div>
                    </div>
                    <p className="text-lg text-indigo-300">
                      Connecting to camera...
                    </p>
                  </div>
                )}
                {/* Connection status overlay - only show when streaming */}
                {isStreaming && (
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium">
                    <div
                      className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}
                    ></div>
                    {connectionStatus === "connected"
                      ? "Live"
                      : "Connecting..."}
                  </div>
                )}
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={toggleProcessing}
              disabled={isConnecting || !openCvLoaded}
              className={`w-full py-4 rounded-xl flex items-center justify-center font-semibold text-lg shadow-lg transition-all ${
                isConnecting || !openCvLoaded
                  ? "bg-gray-700/60 cursor-not-allowed"
                  : isStreaming
                  ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  : "bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900"
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
                  <Video className="mr-2" />
                  Loading Face Detection...
                </>
              ) : isStreaming ? (
                <>
                  <VideoOff className="mr-2" />
                  Stop Attendance Tracking
                </>
              ) : (
                <>
                  <Video className="mr-2" />
                  Start Attendance Tracking
                </>
              )}
            </button>

            {/* Stats panel */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <Activity className="text-emerald-400" />
                Recognition Statistics
              </h2>

              <div className="grid grid-cols-3 gap-4">
                {/* Face count */}
                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 transition-all hover:border-slate-600/50">
                  <div className="mb-2 text-slate-400 text-sm flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>Total Faces</span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {stats.totalFaces}
                  </div>
                </div>

                {/* Recognized count */}
                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 transition-all hover:border-emerald-800/60">
                  <div className="mb-2 text-emerald-400 text-sm flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>Recognized</span>
                  </div>
                  <div className="text-3xl font-bold text-emerald-400">
                    {stats.recognized}
                  </div>
                </div>

                {/* Unknown count */}
                <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 transition-all hover:border-amber-800/60">
                  <div className="mb-2 text-amber-400 text-sm flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Unknown</span>
                  </div>
                  <div className="text-3xl font-bold text-amber-400">
                    {stats.unknown}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column - Controls and Results (2 columns on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Settings panel */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <Settings className="text-indigo-400" />
                Session Settings
              </h2>

              {/* Course code input */}
              <div className="mb-4">
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
                    placeholder="E.g. CS101"
                    required
                    disabled={isStreaming}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Location input */}
              <div className="mb-4">
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
                    placeholder="E.g. Room 204"
                    disabled={isStreaming}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="text-slate-500" />
                  </div>
                </div>
              </div>

              {/* Threshold slider */}
              <div>
                <label
                  htmlFor="threshold"
                  className="flex justify-between text-sm font-medium text-indigo-300 mb-1.5"
                >
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4" />
                    Recognition Threshold
                  </span>
                  <span className="font-mono bg-slate-900 px-2 py-0.5 rounded text-xs">
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
                  className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  disabled={isStreaming}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>Less strict (0.1)</span>
                  <span>More strict (0.9)</span>
                </div>
              </div>
            </div>

            {/* Results tabs */}
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-md">
              {/* Tab navigation */}
              <div className="flex border-b border-slate-700">
                <button
                  onClick={() => setActiveTab("attendance")}
                  className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    activeTab === "attendance"
                      ? "bg-indigo-900/30 text-indigo-300 border-b-2 border-indigo-500"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <Check className="w-4 h-4" />
                  Attendance Results
                </button>
                <button
                  onClick={() => setActiveTab("logs")}
                  className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    activeTab === "logs"
                      ? "bg-indigo-900/30 text-indigo-300 border-b-2 border-indigo-500"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  WebSocket Logs
                </button>
              </div>

              {/* Tab content */}
              <div className="p-4 max-h-80 overflow-hidden flex flex-col">
                {/* Attendance Results Tab */}
                {activeTab === "attendance" && (
                  <div className="overflow-y-auto flex-grow pr-1">
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      Recent Attendance
                    </h3>

                    {attendanceResults.length > 0 ? (
                      <ul className="space-y-2">
                        {attendanceResults.map((result, index) => (
                          <li
                            key={index}
                            className="p-3 bg-slate-800/80 rounded-lg text-sm flex justify-between items-center border-l-4 border-l-indigo-500 hover:bg-slate-800 transition-colors"
                          >
                            <span className="font-medium text-white">
                              {result.reg_number}
                            </span>
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center ${
                                result.status === "PRESENT"
                                  ? "bg-green-900/40 text-green-300 border border-green-700"
                                  : result.status === "LATE"
                                  ? "bg-yellow-900/40 text-yellow-300 border border-yellow-700"
                                  : "bg-red-900/40 text-red-300 border border-red-700"
                              }`}
                            >
                              {result.status === "PRESENT" && (
                                <Check className="w-3 h-3 mr-1" />
                              )}
                              {result.status}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-36 text-slate-400">
                        <AlertTriangle className="text-4xl mb-3 text-slate-500 opacity-30" />
                        <p className="text-center">
                          {isStreaming
                            ? "Waiting for recognition results..."
                            : "Start processing to see attendance results"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* WebSocket Logs Tab */}
                {activeTab === "logs" && (
                  <div className="overflow-y-auto flex-grow pr-1">
                    <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-indigo-400" />
                      WebSocket Communication Log
                    </h3>

                    {wsLogs.length > 0 ? (
                      <div className="space-y-1">
                        {wsLogs.map(renderLogEntry)}
                        <div ref={logsEndRef} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-36 text-slate-400">
                        <LayoutDashboard className="text-4xl mb-3 text-slate-500 opacity-30" />
                        <p className="text-center">
                          {isStreaming
                            ? "Waiting for WebSocket activity..."
                            : "Start processing to see WebSocket logs"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RealTimeAttendance;
