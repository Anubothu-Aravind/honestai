import express from "express";
import { createScreen } from "../controllers/screen.js";

const router = express.Router();

router.post("/", createScreen);

export default router;