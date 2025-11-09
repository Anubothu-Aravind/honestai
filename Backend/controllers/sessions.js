/**
 * @fileoverview Session controller for TrueScope.
 * - createSession: create and persist a new session document (adds a shareId if missing).
 * - listSessions: list sessions (admin can list all; regular users must pass userId).
 * - getSession: fetch a session by _id or by report.shareId (shareable link).
 * - exportSessionPdf: render a session report to PDF, upload to Cloudinary, and return download URL.
 *
 * Notes:
 * - Cloudinary must be configured via environment variables:
 *   CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
 * - PDF generation is done in-memory using PDFKit; large sessions may increase memory usage.
 */

import crypto from "crypto";
import Session from "../models/Session.js";
import PDFDocument from "pdfkit";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables (ensure these are set in production)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Create a new session record.
 * - Adds a report.shareId (UUID) if one is not provided in the payload.
 *
 * @example
 * POST /api/sessions
 * {
 *   "userId": "user123",
 *   "type": "interview",
 *   "report": { "title": "Interview 1" }
 * }
 *
 * @param {Object} req - Express request object (body contains session payload)
 * @param {Object} res - Express response object
 * @param {Function} next - Express next for error handling
 * @returns {Promise<void>} 201 with created session or forwards error to next middleware
 */
export const createSession = async (req, res, next) => {
  try {
    const payload = req.body || {};

    const session = await Session.create({
      ...payload,
      report: {
        ...payload.report,
        shareId: payload.report?.shareId || crypto.randomUUID(),
      },
    });

    return res.status(201).json({ success: true, session });
  } catch (error) {
    console.error("createSession error:", error);
    res.status(500);
    next(error);
  }
};

/**
 * List sessions.
 * - If X-Admin-Key header matches ADMIN_SECRET, returns the most recent 100 sessions.
 * - Otherwise requires ?userId= to return that user's sessions (most recent 100).
 *
 * @example
 * GET /api/sessions?userId=user123
 * Header: x-admin-key: <optional admin key>
 *
 * @param {Object} req - Express request (query, headers)
 * @param {Object} res - Express response
 * @param {Function} next - Express next for error handling
 * @returns {Promise<void>} 200 with sessions array or 403 when userId missing for non-admins
 */
export const listSessions = async (req, res, next) => {
  try {
    const adminKey = req.header("x-admin-key");
    const isAdmin =
      adminKey &&
      process.env.ADMIN_SECRET &&
      adminKey === process.env.ADMIN_SECRET;

    if (isAdmin) {
      const sessions = await Session.find({}).sort({ createdAt: -1 }).limit(100);
      return res.status(200).json({ success: true, sessions });
    }

    const { userId } = req.query;
    if (!userId) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: userId required" });
    }

    const filter = { userId };
    const sessions = await Session.find(filter).sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error("listSessions error:", error);
    res.status(500);
    next(error);
  }
};

/**
 * Retrieve a single session by document _id or by report.shareId (shareable link).
 *
 * @example
 * GET /api/sessions/:idOrShare
 * GET /api/sessions/share_abc123
 *
 * @param {Object} req - Express request (params.idOrShare)
 * @param {Object} res - Express response
 * @param {Function} next - Express next for error handling
 * @returns {Promise<void>} 200 with session or 404 when not found
 */
export const getSession = async (req, res, next) => {
  try {
    const { idOrShare } = req.params;
    const session = await Session.findOne({
      $or: [{ _id: idOrShare }, { "report.shareId": idOrShare }],
    });

    if (!session) return res.status(404).json({ message: "Session not found" });
    return res.status(200).json({ success: true, session });
  } catch (error) {
    console.error("getSession error:", error);
    res.status(500);
    next(error);
  }
};

/**
 * Export a session to PDF, upload to Cloudinary, save the exported URL on the session,
 * and return a direct download URL (with attachment disposition).
 *
 * Implementation details:
 * - Builds a readable PDF with session metadata and analysis sections.
 * - Streams PDF bytes to memory, uploads the final buffer to Cloudinary using upload_stream.
 * - Saves uploadResult.secure_url as session.report.exportedPdfUrl and returns a fl_attachment URL.
 *
 * @example
 * POST /api/sessions/:id/export
 *
 * @param {Object} req - Express request (params.id)
 * @param {Object} res - Express response
 * @param {Function} next - Express next for error handling
 * @returns {Promise<void>} 200 with { pdfUrl, originalUrl } or 404/500 on error
 */
export const exportSessionPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    // Create PDF in-memory
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    // Header
    doc.fontSize(22).text("Honest-AI Session Report", { align: "center" });
    doc.moveDown();

    // Basic session metadata
    doc.fontSize(12).text(`Session ID: ${session._id}`);
    doc.text(`Share ID: ${session.report?.shareId || "-"}`);
    doc.text(`User ID: ${session.userId || "-"}`);
    doc.text(`Started: ${session.startedAt?.toISOString() || "-"}`);
    doc.text(`Ended: ${session.endedAt ? session.endedAt.toISOString() : "-"}`);
    doc.text(`Location: ${session.location || "-"}`);
    doc.text(`Type: ${session.type || "-"}`);

    doc.moveDown();
    // Voice analysis
    doc.fontSize(16).text("Voice Analysis");
    doc.fontSize(12);
    const v = session.voice || {};
    doc.text(`Pitch: ${v.pitchScore ?? "-"}`);
    doc.text(`Tone: ${v.toneScore ?? "-"}`);
    doc.text(`Tremor: ${v.tremorScore ?? "-"}`);
    doc.text(`Hesitation: ${v.hesitationScore ?? "-"}`);
    doc.text(`Sentiment: ${v.sentimentScore ?? "-"}`);
    doc.text(`Emotional: ${v.emotionalScore ?? "-"}`);
    doc.text(`Stress: ${v.stressScore ?? "-"}`);

    doc.moveDown();
    // Facial analysis
    doc.fontSize(16).text("Facial Analysis");
    doc.fontSize(12);
    const f = session.facial || {};
    doc.text(`Micro-expressions: ${f.microExpressionsScore ?? "-"}`);
    doc.text(`Blinking: ${f.blinkingScore ?? "-"}`);
    doc.text(`Eye Movement: ${f.eyeMovementScore ?? "-"}`);
    doc.text(`Smile Suppression: ${f.smileSuppressionScore ?? "-"}`);
    doc.text(`Visual Emotion: ${f.visualEmotionScore ?? "-"}`);

    doc.moveDown();
    // Text analysis
    doc.fontSize(16).text("Text Analysis");
    doc.fontSize(12);
    const t = session.text || {};
    doc.text(`Tone: ${t.toneScore ?? "-"}`);
    doc.text(`Sentiment: ${t.sentimentScore ?? "-"}`);
    doc.text(`Inconsistency: ${t.inconsistencyScore ?? "-"}`);

    doc.moveDown();
    // Truth score
    doc.fontSize(16).text("Truth Score");
    doc.fontSize(12);
    const tr = session.truth || {};
    doc.text(`Truthfulness: ${tr.truthfulness ?? "-"}`);
    doc.text(`Confidence: ${tr.confidence ?? "-"}`);
    doc.text(`Interpretation: ${tr.interpretation ?? "-"}`);

    doc.moveDown();
    // Notes / transcript excerpts
    doc.fontSize(16).text("Notes");
    doc.fontSize(12);
    if (session.transcript)
      doc.text(`Transcript: ${session.transcript.substring(0, 1000)}...`);
    if (session.textInput)
      doc.text(`Text Input: ${session.textInput.substring(0, 1000)}...`);

    doc.end();

    // Wait for PDF generation to finish and collect buffer
    await new Promise((resolve) => doc.on("end", resolve));
    const buffer = Buffer.concat(chunks);

    // Upload buffer to Cloudinary using an upload stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: "auto",
        folder: "session_reports",
        public_id: `report_${session._id}_${Date.now()}`,
        format: "pdf",
        type: "upload",
        content_type: "application/pdf",
      };

      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => (error ? reject(error) : resolve(result))
      );
      stream.end(buffer);
    });

    // Persist PDF URL to the session document
    session.report = session.report || {};
    session.report.exportedPdfUrl = uploadResult.secure_url;
    await session.save();

    // Construct an attachment-style URL (Cloudinary transformation)
    const pdfUrl = uploadResult.secure_url.replace(
      "/upload/",
      "/upload/fl_attachment/"
    );

    return res.status(200).json({
      success: true,
      pdfUrl,
      originalUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error("exportSessionPdf error:", error);
    res.status(500);
    next(error);
  }
};
