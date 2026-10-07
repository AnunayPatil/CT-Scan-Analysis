import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const analysisResultSchema = new mongoose.Schema({
  _id: { type: String, default: () => `result_${uuidv4().split("-")[0]}` },
  scanId: { type: String, ref: "Scan", required: true, unique: true }, // References Scan._id
  prediction: { type: String, required: true },
  confidence: { type: Number, required: true },
  probabilities: {
    Normal: { type: Number },
    Bleeding: { type: Number },
    Ischemia: { type: Number },
    Other: { type: Number }
  },
  modelName: { type: String, default: "EfficientNet-B0 + BiLSTM" },
  modelVersion: { type: String, default: "best_model.pth" },
  processingTime: { type: Number },
  heatmapUrl: { type: String, default: "/placeholder.svg" },
  overlayUrl: { type: String, default: "/placeholder.svg" },
  analyzedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

export default mongoose.model("AnalysisResult", analysisResultSchema);
