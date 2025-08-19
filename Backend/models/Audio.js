import mongoose from "mongoose";

const audioSchema = new mongoose.Schema(
  {
    audioUrl: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Audio = mongoose.model("Audio", audioSchema);
export default Audio;
