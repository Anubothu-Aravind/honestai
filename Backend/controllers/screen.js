import Screen from "../models/screen_recorder.js";

export const createScreen = async (req, res, next) => {
  const { screenUrl } = req.body;

  if (!screenUrl) {
    return res.status(400).json({ message: "Screen URL is required" });
  }

  try {
    const screen = await Screen.create({
      screenUrl,
    });

    res.status(201).json({
      success: true,
      screen,
    });
  } catch (error) {
    console.log(error);
    res.status(500);
    next(error);
  }
};
