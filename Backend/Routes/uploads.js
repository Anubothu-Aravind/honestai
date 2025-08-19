import express from "express";
import Video from "../models/Video.js";
import Audio from "../models/Audio.js";
import Screen from "../models/screen_recorder.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  const { videoUrl, audioUrl, screenUrl } = req.body;
  
  try {
    const uploads = [];
    
    // Create records for each provided URL
    if (videoUrl) {
      const video = await Video.create({ videoUrl });
      uploads.push({ type: "video", data: video });
    }
    
    if (audioUrl) {
      const audio = await Audio.create({ audioUrl });
      uploads.push({ type: "audio", data: audio });
    }
    
    if (screenUrl) {
      const screen = await Screen.create({ screenUrl });
      uploads.push({ type: "screen", data: screen });
    }
    
    res.status(201).json({
      success: true,
      uploads
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    next(error);
  }
});

export default router;