/**
 * @fileoverview Controller for generating Cloudinary upload signatures.
 *
 * This endpoint issues a secure timestamped signature that allows frontend clients
 * to upload files directly to Cloudinary without exposing API secrets.
 *
 * Environment Variables Required:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary } from "cloudinary";

// Initialize Cloudinary configuration from environment variables.
// The `secure: true` flag ensures HTTPS endpoints are used for uploads.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Generate a Cloudinary upload signature.
 *
 * @description
 * This endpoint is called by the frontend before uploading a file to Cloudinary.
 * The backend creates a signed payload with a timestamp and folder name,
 * which the client includes in the upload request to prove authenticity.
 *
 * @example
 * // Request:
 * POST /api/signature
 * {
 *   "folder": "user_uploads/session_01"
 * }
 *
 * // Response:
 * {
 *   "timestamp": 1731177000,
 *   "signature": "a6b5f8e98bfbf27b8c8d5a72b5cd0aef3b123456"
 * }
 *
 * @param {Object} req - Express request object. Expects `req.body.folder` (string).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function for error handling.
 *
 * @returns {void} Sends a JSON response with the generated timestamp and signature.
 *
 * @error 400 - Missing folder parameter.
 * @error 500 - Error during signature generation.
 */
export const generateSignature = (req, res, next) => {
  // Extract the `folder` name from the request body
  const { folder } = req.body;

  // Ensure a folder is provided — required for Cloudinary signature generation
  if (!folder) {
    res.status(400); // Set 400 Bad Request status
    return next(new Error("folder name is required")); // Pass error to Express middleware
  }

  try {
    // Generate a UNIX timestamp (in seconds) for the current request
    // Cloudinary uses this to prevent replay attacks — signatures expire after a few minutes
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Use Cloudinary's utility to create a signed request
    // The signature is a hash of the parameters and the Cloudinary API secret
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp, // current timestamp
        folder,    // target folder for uploads
      },
      process.env.CLOUDINARY_API_SECRET // server-side secret key
    );

    // Respond with the timestamp and generated signature
    // The frontend uses these values in its upload request to Cloudinary
    res.status(200).json({ timestamp, signature });
  } catch (error) {
    // Log the error for debugging
    console.error("generateSignature error:", error);

    // Send 500 Internal Server Error and pass error to Express middleware
    res.status(500);
    next(error);
  }
};
