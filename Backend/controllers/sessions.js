/**
 * @fileoverview Session controller.
 *
 * Exposes handlers to create, list, fetch, and export session data.
 * - createSession: persist a session (ensures a shareId exists).
 * - listSessions: admin can list all; regular users must pass userId.
 * - getSession: fetch by _id or report.shareId.
 * - exportSessionPdf: render a session report to PDF, upload to Cloudinary,
 *   save the exported URL on the session, and return a download URL.
 *
 * Important environment variables:
 * - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 * - ADMIN_SECRET (for listing all sessions via x-admin-key header)
 *
 * Notes:
 * - PDF generation happens in memory (PDFKit). Large sessions may increase memory usage.
 * - Cloudinary upload uses upload_stream; ensure credentials and network access are correct.
 */

import crypto from "crypto";
import Session from "../models/Session.js";
import PDFDocument from "pdfkit";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary. Ensure environment variables are set in production.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Create a new session record.
 *
 * Adds a report.shareId (UUID) when missing and persists the session document.
 *
 * Request body: arbitrary session payload. Recommended shape:
 * {
 *   userId: string,
 *   type: string,
 *   startedAt: ISOString,
 *   endedAt: ISOString,
 *   report: { title?: string, shareId?: string, ... },
 *   voice: {...}, facial: {...}, text: {...}, truth: {...}
 * }
 *
 * Success: 201 { success: true, session }
 * Errors: forwards to next middleware with status 500 on failure.
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
 *
 * Behavior:
 * - If request header x-admin-key matches ADMIN_SECRET, returns the most recent 100 sessions.
 * - Otherwise requires query param userId and returns that user's most recent 100 sessions.
 *
 * Query params:
 * - userId (string) — required for non-admin requests
 *
 * Success: 200 { success: true, sessions }
 * 403 if userId missing for non-admins
 * Errors: forwards to next middleware with status 500 on failure.
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
 * Get a single session by id or shareId.
 *
 * Route params:
 * - idOrShare: document _id or session.report.shareId
 *
 * Success: 200 { success: true, session }
 * 404 if not found
 * Errors: forwards to next middleware with status 500 on failure.
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
 * Export a session to PDF and upload to Cloudinary.
 *
 * Route params:
 * - id: session _id
 *
 * Flow:
 * 1. Find session by id, 404 if missing.
 * 2. Build a readable PDF (session metadata, voice/facial/text/truth sections).
 * 3. Generate PDF in memory, upload buffer to Cloudinary via upload_stream.
 * 4. Store uploadResult.secure_url on session.report.exportedPdfUrl and save.
 * 5. Return a download-friendly URL (Cloudinary fl_attachment transform) and original URL.
 *
 * Success: 200 { success: true, pdfUrl, originalUrl }
 * 404 if session missing
 * Errors: forwards to next middleware with status 500 on failure.
 *
 * Warning: This method buffers the entire PDF in memory before upload. For very large reports
 * or high concurrency, consider streaming to Cloudinary directly without buffering or using
 * a temporary file.
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

    // Voice analysis section
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

    // Facial analysis section
    doc.fontSize(16).text("Facial Analysis");
    doc.fontSize(12);
    const f = session.facial || {};
    doc.text(`Micro-expressions: ${f.microExpressionsScore ?? "-"}`);
    doc.text(`Blinking: ${f.blinkingScore ?? "-"}`);
    doc.text(`Eye Movement: ${f.eyeMovementScore ?? "-"}`);
    doc.text(`Smile Suppression: ${f.smileSuppressionScore ?? "-"}`);
    doc.text(`Visual Emotion: ${f.visualEmotionScore ?? "-"}`);

    doc.moveDown();

    // Text analysis section
    doc.fontSize(16).text("Text Analysis");
    doc.fontSize(12);
    const t = session.text || {};
    doc.text(`Tone: ${t.toneScore ?? "-"}`);
    doc.text(`Sentiment: ${t.sentimentScore ?? "-"}`);
    doc.text(`Inconsistency: ${t.inconsistencyScore ?? "-"}`);

    doc.moveDown();

    // Truth score section
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

    // Wait for PDF generation to complete and collect buffer
    await new Promise((resolve) => doc.on("end", resolve));
    const buffer = Buffer.concat(chunks);

    // Upload PDF buffer to Cloudinary using upload_stream
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

    // Persist exported PDF URL on session and save
    session.report = session.report || {};
    session.report.exportedPdfUrl = uploadResult.secure_url;
    await session.save();

    // Provide an attachment-style URL for direct download (Cloudinary transform)
    const pdfUrl = uploadResult.secure_url.replace("/upload/", "/upload/fl_attachment/");

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
