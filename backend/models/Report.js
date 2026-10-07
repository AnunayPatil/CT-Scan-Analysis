import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const reportSchema = new mongoose.Schema({
  _id: { type: String, default: () => `report_${uuidv4().split("-")[0]}` },
  scanId: { type: String, ref: "Scan", required: true, unique: true }, // References Scan._id
  resultId: { type: String, ref: "AnalysisResult", required: true }, // References AnalysisResult._id
  patientId: { type: String, ref: "Patient", required: true }, // References Patient._id
  reportNumber: { type: String, required: true, unique: true }, // e.g. RPT-2025-0001
  generatedAt: { type: Date, default: Date.now },
  generatedBy: { type: String, ref: "User", required: true }, // References User._id
  findings: { type: String, required: true },
  impression: { type: String, required: true },
  recommendations: { type: String, required: true },
  status: { type: String, enum: ["draft", "finalized"], default: "draft" },
  pdfUrl: { type: String }
}, { 
  timestamps: true 
});

export default mongoose.model("Report", reportSchema);
