/**
 * @fileoverview Controller for creating audio records.
 * Handles requests that register an uploaded audio file (by URL) in the database.
 * Expected to be used by POST /api/audio (or similar) route after client-side upload.
 */

import Audio from "../models/Audio.js";

/**
 * Create a new audio record.
 *
 * Expects `req.body.audioUrl` to contain a publicly accessible URL (or storage reference)
 * to the uploaded audio file. Validates input, saves a new Audio document, and returns
 * the created record.
 *
 * @example
 * // Request
 * POST /api/audio
 * {
 *   "audioUrl": "https://cdn.example.com/uploads/session_01.wav"
 * }
 *
 * @param {Object} req - Express request object. Expects `req.body.audioUrl` (string).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function for error handling.
 *
 * @returns {Promise<void>} Sends JSON response with created audio document or an error.
 *
 * @response 201 - Created
 * {
 *   "success": true,
 *   "audio": {
 *     "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
 *     "audioUrl": "https://cdn.example.com/uploads/session_01.wav",
 *     "createdAt": "2025-11-09T14:00:00.000Z",
 *     "__v": 0
 *   }
 * }
 *
 * @error 400 - Bad Request when audioUrl is missing:
 * { "message": "Audio URL is required" }
 *
 * @error 500 - Internal Server Error for DB or unexpected failures.
 */
export const createAudio = async (req, res, next) => {
  const { audioUrl } = req.body;

  if (!audioUrl) {
    return res.status(400).json({ message: "Audio URL is required" });
  }

  try {
    const audio = await Audio.create({
      audioUrl,
    });

    res.status(201).json({
      success: true,
      audio,
    });
  } catch (error) {
    console.error('createAudio error:', error);
    res.status(500);
    next(error);
  }
};
