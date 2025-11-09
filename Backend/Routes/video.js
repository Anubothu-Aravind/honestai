/**
 * @fileoverview Defines the video-related API routes for the TrueScope project.
 * This route handles video file uploads or video metadata submissions,
 * allowing the backend to store and process video content for analysis.
 */

import express from "express";
import { createVideo } from "../controllers/video.js";

const router = express.Router();

/**
 * @route POST /
 * @description Handles the creation or registration of a new video record.
 * This endpoint is typically used after a successful upload to cloud storage
 * (e.g., Cloudinary, S3) to save the video URL and related metadata in the database.
 * @access Public
 * @example
 * // Request body (JSON)
 * {
 *   "videoUrl": "https://cdn.truescope.ai/uploads/session_01.mp4"
 * }
 * @returns {Object} JSON object containing the created video record.
 * @response
 * {
 *   "message": "Video record created successfully",
 *   "video": {
 *     "_id": "vid_123xyz",
 *     "videoUrl": "https://cdn.truescope.ai/uploads/session_01.mp4",
 *     "createdAt": "2025-11-09T14:00:00Z"
 *   }
 * }
 */
router.post("/", createVideo);

export default router;
