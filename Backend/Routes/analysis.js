/**
 * @fileoverview Defines API routes for the TrueScope analysis module.
 * Each route handles a specific type of data (voice, facial, text)
 * and delegates processing to the corresponding controller functions.
 */

import express from "express";
import { 
  analyzeVoice, 
  analyzeFacial, 
  analyzeText, 
  computeTruthScore, 
  analyzeAll 
} from "../controllers/analysis.js";

const router = express.Router();

/**
 * @route POST /voice
 * @description Analyzes the provided voice input for emotional tone, stress, or truth indicators.
 * @access Public
 * @example
 * // Request body (JSON or FormData)
 * {
 *   "audioData": "<base64 or file reference>"
 * }
 */
router.post("/voice", analyzeVoice);

/**
 * @route POST /facial
 * @description Analyzes facial expressions from an image or video frame
 * to identify emotions and potential cues of deception.
 * @access Public
 * @example
 * // Request body (FormData)
 * {
 *   "imageFile": "<binary data or file upload>"
 * }
 */
router.post("/facial", analyzeFacial);

/**
 * @route POST /text
 * @description Processes textual input to detect sentiment, linguistic patterns,
 * and deception cues.
 * @access Public
 * @example
 * // Request body
 * {
 *   "text": "I am telling the truth."
 * }
 */
router.post("/text", analyzeText);

/**
 * @route POST /truth
 * @description Combines results from multiple analysis modules (voice, facial, text)
 * to compute an overall truthfulness score.
 * @access Public
 * @example
 * // Request body
 * {
 *   "voiceScore": 0.8,
 *   "facialScore": 0.6,
 *   "textScore": 0.9
 * }
 */
router.post("/truth", computeTruthScore);

/**
 * @route POST /all
 * @description Performs a unified analysis using all available data sources
 * (voice, facial, text) and returns a comprehensive truth analysis.
 * @access Public
 * @example
 * // Request body
 * {
 *   "audioData": "<file>",
 *   "imageData": "<file>",
 *   "text": "Sample statement"
 * }
 */
router.post("/all", analyzeAll);

export default router;
