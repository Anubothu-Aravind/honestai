/**
 * @fileoverview Defines session-related API routes for the TrueScope project.
 * These routes manage the creation, retrieval, listing, and export of
 * session data — typically representing individual analysis runs.
 */

import express from "express";
import { 
  createSession, 
  listSessions, 
  getSession, 
  exportSessionPdf 
} from "../controllers/sessions.js";

const router = express.Router();

/**
 * @route POST /
 * @description Creates a new analysis session.
 * Each session may contain associated data such as audio, facial, and text analyses.
 * @access Public
 * @example
 * // Request body (JSON)
 * {
 *   "userId": "user123",
 *   "sessionName": "Interview Test 1",
 *   "data": {
 *     "voice": { "toneScore": 0.78 },
 *     "facial": { "emotion": "confident" },
 *     "text": { "sentiment": "neutral" }
 *   }
 * }
 * @returns {Object} Details of the created session.
 * @response
 * {
 *   "message": "Session created successfully",
 *   "sessionId": "sess_abc123",
 *   "createdAt": "2025-11-09T10:30:00Z"
 * }
 */
router.post("/", createSession);

/**
 * @route GET /
 * @description Retrieves a list of all sessions (optionally filtered by user).
 * Useful for dashboards or session history views.
 * @access Public
 * @example
 * // Query Parameters
 * /?userId=user123
 * @returns {Array} List of session objects.
 * @response
 * [
 *   {
 *     "sessionId": "sess_abc123",
 *     "sessionName": "Interview Test 1",
 *     "createdAt": "2025-11-09T10:30:00Z"
 *   },
 *   {
 *     "sessionId": "sess_def456",
 *     "sessionName": "Meeting Analysis",
 *     "createdAt": "2025-11-08T12:00:00Z"
 *   }
 * ]
 */
router.get("/", listSessions);

/**
 * @route GET /:idOrShare
 * @description Fetches the details of a specific session by ID or a shareable identifier.
 * @access Public
 * @example
 * /api/sessions/sess_abc123
 * /api/sessions/share_789xyz
 * @returns {Object} Detailed session data.
 * @response
 * {
 *   "sessionId": "sess_abc123",
 *   "sessionName": "Interview Test 1",
 *   "analysis": {
 *     "voice": { "confidence": 0.84 },
 *     "facial": { "emotion": "neutral" },
 *     "text": { "truthScore": 0.92 }
 *   }
 * }
 */
router.get("/:idOrShare", getSession);

/**
 * @route POST /:id/export
 * @description Exports the specified session’s results and insights into a downloadable PDF.
 * @access Public
 * @example
 * /api/sessions/sess_abc123/export
 * @returns {File} PDF document of the session report.
 * @response
 * {
 *   "message": "PDF generated successfully",
 *   "pdfUrl": "https://truescope.ai/reports/sess_abc123.pdf"
 * }
 */
router.post("/:id/export", exportSessionPdf);

export default router;
