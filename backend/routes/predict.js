import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { authenticateToken } from "../middleware/auth.js";
import Patient from "../models/Patient.js";
import Scan from "../models/Scan.js";
import AnalysisResult from "../models/AnalysisResult.js";

const router = express.Router();

// Configure disk storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new Error("Only image uploads are supported"));
    }
    callback(null, true);
  },
});

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

router.post("/", upload.single("image"), authenticateToken, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Image file is required",
      });
    }

    // req.user is guaranteed by authenticateToken middleware
    const user = req.user;
    
    // Resolve patient
    let patient = null;
    if (req.body.patientId) {
      patient = await Patient.findById(req.body.patientId);
    } else if (user.patientId) {
      patient = await Patient.findById(user.patientId);
    } else if (user.email) {
      patient = await Patient.findOne({ email: user.email.toLowerCase().trim() });
    }
    
    if (!patient) {
      // For doctors: they MUST provide a patientId — no silent fallback
      if (user.role === 'doctor' || user.role === 'radiologist' || user.role === 'admin') {
        return res.status(400).json({
          success: false,
          error: "Please provide a valid patientId when uploading a scan.",
        });
      }
      // For patients: try first patient in DB as last resort (should not normally happen)
      patient = await Patient.findOne();
    }

    if (!patient) {
      return res.status(400).json({
        success: false,
        error: "No patient record found. Please register as a patient first.",
      });
    }

    // Read saved file from disk to forward to Python ML service
    const fileBuffer = fs.readFileSync(req.file.path);
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: req.file.mimetype });
    formData.append("image", blob, req.file.filename);

    const response = await fetch(`${ML_SERVICE_URL}/predict`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data?.detail || data?.error || "Prediction service failed",
      });
    }

    const now = new Date();

    // Create scan in MongoDB — uploadedBy is the authenticated user's ID
    const newScan = new Scan({
      patientId: patient._id,
      uploadedBy: user.id,
      status: "completed",
      imageUrls: [`/uploads/${req.file.filename}`],
      thumbnailUrl: `/uploads/${req.file.filename}`,
      sliceCount: 1,
      fileSize: req.file.size,
      format: req.file.mimetype.includes("png") ? "PNG" : "JPG",
      scanDate: now,
      uploadedAt: now,
      analyzedAt: now,
      metadata: {
        modality: "CT",
        bodyPart: "HEAD",
        resolution: "224x224",
        originalFileName: req.file.originalname,
      },
    });
    await newScan.save();

    // Create analysis result in MongoDB
    const predictionClass = data.predicted_class.toLowerCase();
    const newResult = new AnalysisResult({
      scanId: newScan._id,
      prediction: predictionClass,
      confidence: data.confidence,
      probabilities: {
        Normal: data.probabilities?.Normal || 0,
        Bleeding: data.probabilities?.Bleeding || 0,
        Ischemia: data.probabilities?.Ischemia || 0,
        Other: data.probabilities?.Other || 0,
      },
      modelName: "EfficientNet-B0 + BiLSTM",
      modelVersion: "best_model.pth",
      processingTime: data.processing_time_ms,
      heatmapUrl: `/uploads/${req.file.filename}`,
      overlayUrl: `/uploads/${req.file.filename}`,
      analyzedAt: now,
    });
    await newResult.save();

    const scanObj = newScan.toObject();
    scanObj.id = scanObj._id;

    const resultObj = newResult.toObject();
    resultObj.id = resultObj._id;

    res.json({
      success: true,
      data: {
        ...data,
        scan: scanObj,
        result: resultObj,
      },
    });
  } catch (error) {
    console.error("Prediction error:", error);
    res.status(503).json({
      success: false,
      error:
        "Prediction service is unavailable. Start the FastAPI service on port 8000 and try again.",
    });
  }
});

export default router;
