import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const scanSchema = new mongoose.Schema({
  _id: { type: String, default: () => `scan_${uuidv4().split("-")[0]}` },
  patientId: { type: String, ref: "Patient", required: true }, // References Patient._id
  uploadedBy: { type: String, ref: "User", required: true }, // References User._id
  status: { type: String, enum: ["pending", "analyzing", "completed", "failed"], default: "pending" },
  imageUrls: [{ type: String }],
  thumbnailUrl: { type: String },
  sliceCount: { type: Number, default: 1 },
  fileSize: { type: Number, required: true },
  format: { type: String, required: true },
  scanDate: { type: Date, default: Date.now },
  uploadedAt: { type: Date, default: Date.now },
  analyzedAt: { type: Date },
  metadata: {
    modality: { type: String, default: "CT" },
    bodyPart: { type: String, default: "HEAD" },
    resolution: { type: String, default: "512x512" },
    sliceThickness: { type: String, default: "5mm" },
    originalFileName: { type: String }
  }
}, { 
  timestamps: true 
});

export default mongoose.model("Scan", scanSchema);
