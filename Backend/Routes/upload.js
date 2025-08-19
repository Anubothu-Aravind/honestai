import express from "express";
import { generateSignature } from "../controllers/sign-upload.js";

const router = express.Router();

router.post("/signature", generateSignature);

export default router;