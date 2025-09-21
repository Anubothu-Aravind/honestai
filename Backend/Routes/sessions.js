import express from "express";
import { createSession, listSessions, getSession, exportSessionPdf } from "../controllers/sessions.js";

const router = express.Router();

router.post("/", createSession);
router.get("/", listSessions);
router.get("/:idOrShare", getSession);
router.post("/:id/export", exportSessionPdf);

export default router; 