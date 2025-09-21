import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema({
  label: { type: String },
  value: { type: Number, min: 0, max: 100 },
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  userId: { type: String },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
  location: { type: String },
  type: { type: String, enum: ["live", "recorded"], default: "recorded" },

  // Source media/text
  audioUrl: { type: String },
  videoUrl: { type: String },
  screenUrl: { type: String },
  transcript: { type: String },
  textInput: { type: String },

  // Analysis results
  voice: {
    pitchScore: Number,
    toneScore: Number,
    tremorScore: Number,
    hesitationScore: Number,
    sentimentScore: Number,
    emotionalScore: Number,
    stressScore: Number,
  },
  facial: {
    microExpressionsScore: Number,
    blinkingScore: Number,
    eyeMovementScore: Number,
    smileSuppressionScore: Number,
    visualEmotionScore: Number,
  },
  text: {
    toneScore: Number,
    sentimentScore: Number,
    inconsistencyScore: Number,
  },
  truth: {
    truthfulness: Number,
    confidence: Number,
    interpretation: String,
  },

  // Calibration and control questions
  calibration: {
    used: { type: Boolean, default: false },
    notes: { type: String },
  },

  // Report and sharing
  report: {
    shareId: { type: String, index: true },
    exportedPdfUrl: { type: String },
  },
}, { timestamps: true });

const Session = mongoose.model("Session", sessionSchema);
export default Session; 