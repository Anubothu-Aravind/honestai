/**
 * @fileoverview Defines the screen-related API routes for the TrueScope project.
 * This route handles requests related to screen or video input analysis.
 * Typically used for processing real-time or recorded video frames.
 */

import express from "express";
import { createScreen } from "../controllers/screen.js";

const router = express.Router();

/**
 * @route POST /
 * @description Receives and processes screen or video frame data for analysis.
 * This endpoint is designed to capture facial or behavioral cues
 * from video input and forward it to the screen controller for processing.
 * @access Public
 * @example
 * // Request body (FormData)
 * {
 *   "videoFile": "<binary data or uploaded video frame>"
 * }
 * @example
 * // Alternative JSON structure (for base64 data)
 * {
 *   "frameData": "<base64 encoded image or video frame>"
 * }
 * @returns {Object} Processed frame data or confirmation message.
 * @response
 * {
 *   "message": "Screen data analyzed successfully",
 *   "screenId": "vid_789xyz",
 *   "analysis": {
 *     "emotion": "neutral",
 *     "attentionLevel": 0.85
 *   }
 * }
 */
router.post("/", createScreen);

export default router;
