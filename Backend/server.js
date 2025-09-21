import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import videoRoutes from "./Routes/video.js";
import audioRoutes from "./Routes/audio.js";
import screenRoutes from "./Routes/screen.js";
import uploadRoutes from "./Routes/upload.js";
import uploadsRoutes from "./Routes/uploads.js";
import analysisRoutes from "./Routes/analysis.js";
import sessionsRoutes from "./Routes/sessions.js";

dotenv.config();
connectDB();

const app = express();

// Increase payload size limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

app.use("/api/videos", videoRoutes);
app.use("/api/audios", audioRoutes);
app.use("/api/screens", screenRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/uploads", uploadsRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/sessions", sessionsRoutes);

app.get("/", (req, res) => {
  res.send("Backend API is running...");
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
