/**
 * @fileoverview Defines the audio-related API routes for the TrueScope project.
 * Handles audio file uploads or audio data processing requests.
 */

import express from "express";
import { createAudio } from "../controllers/audio.js";

const router = express.Router();

/**
 * @route POST /
 * @description Handles the creation or upload of audio data for analysis.
 * This endpoint accepts raw audio input (as a file, base64, or URL)
 * and passes it to the audio controller for storage or preprocessing.
 * @access Public
 * @example
 * // Request body (FormData)
 * {
 *   "audioFile": "<binary data or file upload>"
 * }
 * @example
 * // Alternative JSON request
 * {
 *   "audioData": "<base64 string>"
 * }
 * @returns {Object} Success message or processed audio metadata.
 * @response
 * {
 *   "message": "Audio file processed successfully",
 *   "audioId": "123abc",
 *   "duration": 4.2
 * }
 */
router.post("/", createAudio);

export default router;
