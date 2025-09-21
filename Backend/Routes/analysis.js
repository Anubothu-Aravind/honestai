import express from "express";
import { analyzeVoice, analyzeFacial, analyzeText, computeTruthScore, analyzeAll } from "../controllers/analysis.js";

const router = express.Router();

router.post("/voice", analyzeVoice);
router.post("/facial", analyzeFacial);
router.post("/text", analyzeText);
router.post("/truth", computeTruthScore);
router.post("/all", analyzeAll);

export default router; 