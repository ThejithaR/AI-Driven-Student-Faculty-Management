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
