import crypto from "crypto";
import Session from "../models/Session.js";
import PDFDocument from "pdfkit";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

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
    console.error(error);
    res.status(500);
    next(error);
  }
};

export const listSessions = async (req, res, next) => {
  try {
    const adminKey = req.header("x-admin-key");
    const isAdmin =
      adminKey &&
      process.env.ADMIN_SECRET &&
      adminKey === process.env.ADMIN_SECRET;

    if (isAdmin) {
      const sessions = await Session.find({})
        .sort({ createdAt: -1 })
        .limit(100);
      return res.status(200).json({ success: true, sessions });
    }

    const { userId } = req.query;
    if (!userId) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden: userId required" });
    }
    const filter = { userId };
    const sessions = await Session.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);
    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error(error);
    res.status(500);
    next(error);
  }
};

export const getSession = async (req, res, next) => {
  try {
    const { idOrShare } = req.params;
    const session = await Session.findOne({
      $or: [{ _id: idOrShare }, { "report.shareId": idOrShare }],
    });
    if (!session) return res.status(404).json({ message: "Session not found" });
    return res.status(200).json({ success: true, session });
  } catch (error) {
    console.error(error);
    res.status(500);
    next(error);
  }
};

export const exportSessionPdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    // Generate PDF in-memory
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));

    doc.fontSize(22).text("Honest-AI Session Report", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Session ID: ${session._id}`);
    doc.text(`Share ID: ${session.report?.shareId || "-"}`);
    doc.text(`User ID: ${session.userId || "-"}`);
    doc.text(`Started: ${session.startedAt?.toISOString() || "-"}`);
    doc.text(`Ended: ${session.endedAt ? session.endedAt.toISOString() : "-"}`);
    doc.text(`Location: ${session.location || "-"}`);
    doc.text(`Type: ${session.type || "-"}`);

    doc.moveDown();
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
    doc.fontSize(16).text("Facial Analysis");
    doc.fontSize(12);
    const f = session.facial || {};
    doc.text(`Micro-expressions: ${f.microExpressionsScore ?? "-"}`);
    doc.text(`Blinking: ${f.blinkingScore ?? "-"}`);
    doc.text(`Eye Movement: ${f.eyeMovementScore ?? "-"}`);
    doc.text(`Smile Suppression: ${f.smileSuppressionScore ?? "-"}`);
    doc.text(`Visual Emotion: ${f.visualEmotionScore ?? "-"}`);

    doc.moveDown();
    doc.fontSize(16).text("Text Analysis");
    doc.fontSize(12);
    const t = session.text || {};
    doc.text(`Tone: ${t.toneScore ?? "-"}`);
    doc.text(`Sentiment: ${t.sentimentScore ?? "-"}`);
    doc.text(`Inconsistency: ${t.inconsistencyScore ?? "-"}`);

    doc.moveDown();
    doc.fontSize(16).text("Truth Score");
    doc.fontSize(12);
    const tr = session.truth || {};
    doc.text(`Truthfulness: ${tr.truthfulness ?? "-"}`);
    doc.text(`Confidence: ${tr.confidence ?? "-"}`);
    doc.text(`Interpretation: ${tr.interpretation ?? "-"}`);

    doc.moveDown();
    doc.fontSize(16).text("Notes");
    doc.fontSize(12);
    if (session.transcript)
      doc.text(`Transcript: ${session.transcript.substring(0, 1000)}...`);
    if (session.textInput)
      doc.text(`Text Input: ${session.textInput.substring(0, 1000)}...`);

    doc.end();

    await new Promise((resolve) => doc.on("end", resolve));
    const buffer = Buffer.concat(chunks);

    // Upload PDF to Cloudinary with proper configuration
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

    // Save the URL to the session
    session.report = session.report || {};
    session.report.exportedPdfUrl = uploadResult.secure_url;
    await session.save();

    // Create a direct download URL with proper content disposition
    const pdfUrl = uploadResult.secure_url.replace(
      "/upload/",
      "/upload/fl_attachment/"
    );

    return res.status(200).json({
      success: true,
      pdfUrl: pdfUrl,
      originalUrl: uploadResult.secure_url,
    });
  } catch (error) {
    console.error(error);
    res.status(500);
    next(error);
  }
};
