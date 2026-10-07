import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const patientSchema = new mongoose.Schema({
  _id: { type: String, default: () => `pat_${uuidv4().split("-")[0]}` },
  patientId: { type: String, required: true, unique: true }, // e.g. P-2025-0001
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  gender: { type: String, enum: ["male", "female", "other", "unspecified"], default: "other" },
  contactNumber: { type: String },
  email: { type: String, unique: true, lowercase: true },
}, { 
  timestamps: true 
});

export default mongoose.model("Patient", patientSchema);
