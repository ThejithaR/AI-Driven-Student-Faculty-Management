import axios from "axios";

// Get the backend URL from environment variables
//const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
const backendUrl = "http://localhost:8000";

/**
 * Register a student's face for facial recognition
 * @param {string} regNumber - Student registration number
 * @param {string} imageBase64 - Base64 encoded image (without the data:image prefix)
 * @returns {Promise<Object>} - Response from the API
 */
export const registerFace = async (regNumber, imageBase64) => {
  try {
    const response = await axios.post(
      `${backendUrl}/attendance/register-face`,
      {
        reg_number: regNumber,
        image_base64: imageBase64,
      }
    );

    return response.data;
  } catch (error) {
    // Handle API errors
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      "Failed to register face. Please try again.";

    throw new Error(errorMessage);
  }
};

/**
 * Mark attendance manually for a student
 * @param {string} regNumber - Student registration number
 * @param {string} status - Attendance status (PRESENT, ABSENT, LATE, EXCUSED)
 * @param {string} location - Location where attendance is marked (optional)
 * @param {string} courseCode - Course code for which attendance is marked
 * @returns {Promise<Object>} - Response from the API
 */
export const markManualAttendance = async (
  regNumber,
  status,
  location,
  courseCode
) => {
  try {
    const response = await axios.post(`${backendUrl}/attendance/manual`, {
      reg_number: regNumber,
      status: status,
      location: location || null,
      course_code: courseCode,
    });

    return response.data;
  } catch (error) {
    // Handle API errors
    const errorMessage =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      "Failed to mark attendance. Please try again.";

    throw new Error(errorMessage);
  }
};

/**
 * API module for real-time attendance system
 */

/**
 * API module for real-time attendance system
 */

/**
 * Create a WebSocket connection for real-time face recognition
 * @param {Object} callbacks - Object containing callback functions
 * @param {Function} callbacks.onMessage - Callback for handling incoming messages
 * @param {Function} callbacks.onOpen - Callback for when connection is opened
 * @param {Function} callbacks.onError - Callback for handling errors
 * @param {Function} callbacks.onClose - Callback for when connection is closed
 * @param {Function} callbacks.onLog - Callback for logging events (optional)
 * @returns {WebSocket} - WebSocket connection object
 */
export const createFaceRecognitionWebSocket = (callbacks) => {
  const { onMessage, onOpen, onError, onClose, onLog } = callbacks;
  const wsUrl = `${"ws://localhost:8000"}/realtime/face-recognition`;

  try {
    const ws = new WebSocket(wsUrl);

    // Enhanced event handlers with logging
    ws.onopen = (event) => {
      if (onLog) onLog(`WebSocket connection opened to ${wsUrl}`);
      if (onOpen) onOpen(event);
    };

    ws.onmessage = (event) => {
      if (onLog)
        onLog(`Received WebSocket message: ${event.data.substring(0, 100)}...`);
      if (onMessage) onMessage(event);
    };

    ws.onerror = (error) => {
      if (onLog) onLog(`WebSocket error: ${error}`);
      if (onError) onError(error);
    };

    ws.onclose = (event) => {
      if (onLog)
        onLog(
          `WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`
        );
      if (onClose) onClose(event);
    };

    return ws;
  } catch (error) {
    if (onLog) onLog(`Failed to create WebSocket: ${error.message}`);
    if (onError) onError(error);
    return null;
  }
};

/**
 * Send a frame to the WebSocket server for face recognition
 * @param {WebSocket} ws - WebSocket connection
 * @param {string} imageBase64 - Base64 encoded image
 * @param {Object} options - Options for recognition
 * @param {number} options.threshold - Recognition threshold (0.1-0.9)
 * @param {string} options.location - Location where attendance is marked (optional)
 * @param {string} options.courseCode - Course code for which attendance is marked
 * @param {Function} onLog - Callback for logging events (optional)
 * @returns {boolean} - True if message was sent successfully
 */
export const sendFrameForRecognition = (ws, imageBase64, options, onLog) => {
  const { threshold = 0.6, location = null, courseCode } = options;

  if (!ws) {
    if (onLog) onLog("WebSocket is not initialized");
    return false;
  }

  if (ws.readyState !== WebSocket.OPEN) {
    if (onLog) onLog(`WebSocket is not open. Current state: ${ws.readyState}`);
    return false;
  }

  if (!imageBase64) {
    if (onLog) onLog("No image data to send");
    return false;
  }

  if (!courseCode) {
    if (onLog) onLog("Course code is required");
    return false;
  }

  try {
    const payload = {
      image_base64: imageBase64,
      threshold: threshold,
      location: location,
      course_code: courseCode,
    };

    ws.send(JSON.stringify(payload));
    if (onLog) onLog(`Frame sent with threshold ${threshold}`);
    return true;
  } catch (error) {
    if (onLog) onLog(`Error sending frame: ${error.message}`);
    console.error("Error sending frame:", error);
    return false;
  }
};

/**
 * Capture a frame from video element and convert to base64
 * @param {HTMLVideoElement} videoElement - Video element to capture from
 * @param {HTMLCanvasElement} canvasElement - Canvas element to use for capture
 * @param {Object} options - Capture options
 * @param {number} options.quality - JPEG quality (0-1)
 * @param {Function} onLog - Callback for logging events (optional)
 * @returns {string|null} - Base64 encoded image or null if capture failed
 */
export const captureFrameFromVideo = (
  videoElement,
  canvasElement,
  options = {},
  onLog
) => {
  const { quality = 0.8 } = options;

  if (!videoElement || !canvasElement) {
    if (onLog) onLog("Video or canvas element is missing");
    return null;
  }

  if (!videoElement.videoWidth || !videoElement.videoHeight) {
    if (onLog) onLog("Video dimensions are not available yet");
    return null;
  }

  try {
    const context = canvasElement.getContext("2d");

    // Match canvas dimensions to video
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;

    // Draw video frame to canvas
    context.drawImage(
      videoElement,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );

    // Convert canvas to base64 image (remove data:image/jpeg;base64, prefix)
    const base64Image = canvasElement
      .toDataURL("image/jpeg", quality)
      .split(",")[1];

    if (onLog)
      onLog(`Frame captured: ${canvasElement.width}x${canvasElement.height}`);
    return base64Image;
  } catch (error) {
    if (onLog) onLog(`Error capturing frame: ${error.message}`);
    console.error("Error capturing frame:", error);
    return null;
  }
};

/**
 * Set up frame capture interval
 * @param {Function} captureFunction - Function to execute on each interval
 * @param {number} intervalMs - Interval in milliseconds
 * @param {Function} onLog - Callback for logging events (optional)
 * @returns {number} - Interval ID for clearing later
 */
export const setupCaptureInterval = (
  captureFunction,
  intervalMs = 1000,
  onLog
) => {
  if (onLog) onLog(`Setting up capture interval every ${intervalMs}ms`);
  return setInterval(captureFunction, intervalMs);
};

/**
 * Start camera stream
 * @param {HTMLVideoElement} videoElement - Video element to attach stream to
 * @param {Object} constraints - Media constraints
 * @param {Function} onLog - Callback for logging events (optional)
 * @returns {Promise<MediaStream|null>} - Media stream or null if failed
 */
export const startCameraStream = async (
  videoElement,
  constraints = {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      facingMode: "user",
    },
  },
  onLog
) => {
  if (onLog) onLog("Requesting camera access...");

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    if (onLog) {
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      onLog(`Camera access granted: ${settings.width}x${settings.height}`);
    }

    if (videoElement) {
      videoElement.srcObject = stream;
      try {
        await videoElement.play();
        if (onLog) onLog("Video playback started");
      } catch (playError) {
        if (onLog) onLog(`Error playing video: ${playError.message}`);
        return null;
      }
    }

    return stream;
  } catch (error) {
    if (onLog) onLog(`Error accessing camera: ${error.message}`);
    console.error("Error accessing camera:", error);
    return null;
  }
};

/**
 * Stop camera stream
 * @param {HTMLVideoElement} videoElement - Video element with stream to stop
 * @param {Function} onLog - Callback for logging events (optional)
 */
export const stopCameraStream = (videoElement, onLog) => {
  if (videoElement && videoElement.srcObject) {
    const tracks = videoElement.srcObject.getTracks();
    if (onLog) onLog(`Stopping ${tracks.length} media tracks`);

    tracks.forEach((track) => {
      track.stop();
      if (onLog) onLog(`Stopped track: ${track.kind}`);
    });

    videoElement.srcObject = null;
    if (onLog) onLog("Camera stream stopped");
  } else if (onLog) {
    onLog("No active camera stream to stop");
  }
};

/**
 * Parse WebSocket response data
 * @param {MessageEvent} event - WebSocket message event
 * @param {Function} onLog - Callback for logging events (optional)
 * @returns {Object|null} - Parsed data or null if parsing failed
 */
export const parseWebSocketResponse = (event, onLog) => {
  try {
    const data = JSON.parse(event.data);
    if (onLog) onLog(`Successfully parsed WebSocket response`);
    return data;
  } catch (error) {
    if (onLog) onLog(`Error parsing WebSocket response: ${error.message}`);
    console.error("Error parsing WebSocket response:", error);
    return null;
  }
};
