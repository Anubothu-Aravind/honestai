/**
 * @fileoverview Defines the upload management route for the TrueScope project.
 * Handles incoming upload metadata (video, audio, or screen recordings),
 * creates corresponding records in the database, and returns structured responses.
 */

import express from "express";
import Video from "../models/Video.js";
import Audio from "../models/Audio.js";
import Screen from "../models/screen_recorder.js";

const router = express.Router();

/**
 * @route POST /
 * @description Accepts upload URLs for video, audio, and/or screen recordings
 * and stores them in their respective collections. Supports multiple file types
 * in a single request.
 * @access Public
 * @example
 * // Request body (JSON)
 * {
 *   "videoUrl": "https://cdn.truescope.ai/uploads/interview_vid.mp4",
 *   "audioUrl": "https://cdn.truescope.ai/uploads/interview_audio.wav",
 *   "screenUrl": "https://cdn.truescope.ai/uploads/screen_capture.mp4"
 * }
 * @returns {Object} JSON response containing created upload records.
 * @response
 * {
 *   "success": true,
 *   "uploads": [
 *     {
 *       "type": "video",
 *       "data": {
 *         "_id": "vid_123abc",
 *         "videoUrl": "https://cdn.truescope.ai/uploads/interview_vid.mp4",
 *         "createdAt": "2025-11-09T09:30:00Z"
 *       }
 *     },
 *     {
 *       "type": "audio",
 *       "data": {
 *         "_id": "aud_456xyz",
 *         "audioUrl": "https://cdn.truescope.ai/uploads/interview_audio.wav",
 *         "createdAt": "2025-11-09T09:30:01Z"
 *       }
 *     }
 *   ]
 * }
 */
router.post("/", async (req, res, next) => {
  const { videoUrl, audioUrl, screenUrl } = req.body;

  try {
    const uploads = [];

    // Create records for each provided URL
    if (videoUrl) {
      const video = await Video.create({ videoUrl });
      uploads.push({ type: "video", data: video });
    }

    if (audioUrl) {
      const audio = await Audio.create({ audioUrl });
      uploads.push({ type: "audio", data: audio });
    }

    if (screenUrl) {
      const screen = await Screen.create({ screenUrl });
      uploads.push({ type: "screen", data: screen });
    }

    res.status(201).json({
      success: true,
      uploads,
    });
  } catch (error) {
    console.error(error);
    res.status(500);
    next(error);
  }
});

export default router;
