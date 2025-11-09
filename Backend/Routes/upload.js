/**
 * @fileoverview Defines the signature generation route for secure media uploads
 * in the TrueScope project. This route provides an upload signature or token
 * that allows clients to securely upload files (e.g., audio, video, or images)
 * to a cloud storage provider such as Cloudinary or AWS S3.
 */

import express from "express";
import { generateSignature } from "../controllers/sign-upload.js";

const router = express.Router();

/**
 * @route POST /signature
 * @description Generates a secure upload signature or token to authenticate
 * and authorize direct uploads to a cloud storage provider.
 * Typically used by the frontend before uploading media files.
 * @access Public
 * @example
 * // Request body (JSON)
 * {
 *   "uploadType": "image",
 *   "fileName": "frame_01.png"
 * }
 * @returns {Object} Signature or signed payload for client-side upload.
 * @response
 * {
 *   "signature": "f3b4a1e24f...",
 *   "timestamp": 1731168600,
 *   "apiKey": "12345abcdef",
 *   "cloudName": "truescope-media"
 * }
 */
router.post("/signature", generateSignature);

export default router;
