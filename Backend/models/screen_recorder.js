import mongoose from "mongoose";

const screenSchema = new mongoose.Schema(
  {
    screenUrl: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const Screen = mongoose.model("Screen", screenSchema);
export default Screen;
