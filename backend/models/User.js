import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema({
  _id: { type: String, default: () => `usr_${uuidv4().split("-")[0]}` },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ["doctor", "radiologist", "patient", "admin"], required: true },
  department: { type: String },
  specialization: { type: String },
  patientId: { type: String }, // References Patient._id
  avatar: { type: String },
  lastLogin: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

export default mongoose.model("User", userSchema);
