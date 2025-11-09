/**
 * @fileoverview Controller for creating screen recording records.
 * Handles API requests that register a captured screen recording by URL
 * in the database. Intended to be used after successful client-side upload.
 */

import Screen from "../models/screen_recorder.js";

/**
 * Create a new screen recording record.
 *
 * Validates the incoming request to ensure a `screenUrl` is provided, 
 * stores it in the database, and returns the created document as JSON.
 *
 * @example
 * // Request
 * POST /api/screen
 * {
 *   "screenUrl": "https://cdn.truescope.ai/uploads/session_01_screen.mp4"
 * }
 *
 * @param {Object} req - Express request object. Expects `req.body.screenUrl` (string).
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function for error handling.
 *
 * @returns {Promise<void>} Sends a JSON response with the newly created screen record
 * or an appropriate error message.
 *
 * @response 201 - Created
 * {
 *   "success": true,
 *   "screen": {
 *     "_id": "673b5e86afca1a9012d5c0f8",
 *     "screenUrl": "https://cdn.truescope.ai/uploads/session_01_screen.mp4",
 *     "createdAt": "2025-11-09T14:00:00.000Z",
 *     "__v": 0
 *   }
 * }
 *
 * @error 400 - Missing screen URL.
 * { "message": "Screen URL is required" }
 *
 * @error 500 - Database or unexpected error.
 */
export const createScreen = async (req, res, next) => {
  const { screenUrl } = req.body;

  if (!screenUrl) {
    return res.status(400).json({ message: "Screen URL is required" });
  }

  try {
    const screen = await Screen.create({ screenUrl });

    res.status(201).json({
      success: true,
      screen,
    });
  } catch (error) {
    console.error("createScreen error:", error);
    res.status(500);
    next(error);
  }
};
