import Audio from "../models/Audio.js";

export const createAudio = async (req, res, next) => {
  const { audioUrl } = req.body;

  if (!audioUrl) {
    return res.status(400).json({ message: "Audio URL is required" });
  }

  try {
    const audio = await Audio.create({
      audioUrl,
    });

    res.status(201).json({
      success: true,
      audio,
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    next(error);
  }
};
