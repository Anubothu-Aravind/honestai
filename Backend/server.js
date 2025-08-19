import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import videoRoutes from "./Routes/video.js";
import audioRoutes from "./Routes/audio.js";
import screenRoutes from "./Routes/screen.js";
import uploadRoutes from "./Routes/upload.js";
import uploadsRoutes from "./Routes/uploads.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/videos", videoRoutes);
app.use("/api/audios", audioRoutes);
app.use("/api/screens", screenRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/uploads", uploadsRoutes);

app.get("/", (req, res) => {
  res.send("Backend API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
