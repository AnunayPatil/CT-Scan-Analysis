import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import Scan from "../models/Scan.js";
import Patient from "../models/Patient.js";
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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

/**
 * GET /api/v1/scans
 * List scans (role-based filtering with database)
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { status, patientId, page = 1, pageSize = 10 } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};

    // Role-based filtering
    if (userRole === "patient") {
      // Find patient record by patientId from token, or by user email
      let patient = null;
      if (req.user.patientId) {
        patient = await Patient.findById(req.user.patientId);
      } else {
        patient = await Patient.findOne({ email: req.user.email.toLowerCase().trim() });
      }

      if (patient) {
        filter.patientId = patient._id;
      } else {
        // Return empty result if no patient profile exists
        return res.json({
          success: true,
          data: {
            data: [],
            total: 0,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: 0,
          },
        });
      }
    } else {
      // Doctors see scans they uploaded
      filter.uploadedBy = userId;
    }

    // Apply query filters
    if (status) {
      filter.status = status;
    }
    if (patientId) {
      filter.patientId = patientId;
    }

    // Pagination & query execution
    const limit = parseInt(pageSize);
    const skip = (parseInt(page) - 1) * limit;

    let scans;
    let total;

    // If search is provided, we need to search across populated patient fields
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      // Get matching patients first
      const matchingPatients = await Patient.find({
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { patientId: searchRegex },
        ]
      }).select('_id');
      const matchingPatientIds = matchingPatients.map(p => p._id);
      filter.patientId = { $in: matchingPatientIds };
    }

    total = await Scan.countDocuments(filter);
    scans = await Scan.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("patientId");

    // Query analysis results for these scans
    const scanIds = scans.map(s => s._id);
    let results = await AnalysisResult.find({ scanId: { $in: scanIds } });

    // Filter by prediction result if requested
    if (req.query.prediction) {
      const matchingScanIds = results
        .filter(r => r.prediction === req.query.prediction)
        .map(r => r.scanId.toString());
      scans = scans.filter(s => matchingScanIds.includes(s._id.toString()));
      results = results.filter(r => r.prediction === req.query.prediction);
      total = scans.length;
    }

    // Map Mongoose _id to id for frontend compatibility
    const scansWithId = scans.map(scan => {
      const scanObj = scan.toObject();
      scanObj.id = scanObj._id;
      if (scanObj.patientId && typeof scanObj.patientId === 'object') {
        scanObj.patient = scanObj.patientId;
        scanObj.patient.id = scanObj.patient._id;
      }
      
      // Attach prediction result if exists - use toString() for ObjectId comparison
      const result = results.find(r => r.scanId.toString() === scanObj._id.toString());
      if (result) {
        scanObj.result = result.toObject();
        scanObj.result.id = result._id;
      }
      return scanObj;
    });

    res.json({
      success: true,
      data: {
        data: scansWithId,
        total,
        page: parseInt(page),
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get scans error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/v1/scans/:id
 * Get scan by ID
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const scan = await Scan.findById(id).populate("patientId");

    if (!scan) {
      return res.status(404).json({
        success: false,
        error: "Scan not found",
      });
    }

    // Get the raw patientId string for access control comparison
    const scanPatientId = typeof scan.patientId === 'object' ? scan.patientId._id : scan.patientId;

    // Role-based access control
    if (userRole === "patient") {
      let patient = null;
      if (req.user.patientId) {
        patient = await Patient.findById(req.user.patientId);
      } else {
        patient = await Patient.findOne({ email: req.user.email.toLowerCase().trim() });
      }

      if (scanPatientId !== patient?._id) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }
    } else {
      if (scan.uploadedBy !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }
    }

    const scanObj = scan.toObject();
    scanObj.id = scanObj._id;
    if (scanObj.patientId && typeof scanObj.patientId === 'object') {
      scanObj.patient = scanObj.patientId;
      scanObj.patient.id = scanObj.patient._id;
    }

    // Fetch and attach result
    const result = await AnalysisResult.findOne({ scanId: scanObj._id });
    if (result) {
      scanObj.result = result.toObject();
      scanObj.result.id = result._id;
    }

    res.json({
      success: true,
      data: scanObj,
    });
  } catch (error) {
    console.error("Get scan error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/v1/scans/upload
 * Upload scan (doctor or patient)
 */
router.post(
  "/upload",
  authenticateToken,
  requireRole("doctor", "radiologist", "admin", "patient"),
  upload.array("files", 50),
  async (req, res) => {
    try {
      const { patientId: requestedPatientId } = req.body;
      const files = req.files || [];

      if (files.length === 0) {
        return res.status(400).json({
          success: false,
          error: "At least one file is required",
        });
      }

      // Determine patient for this upload
      let patientId = requestedPatientId;
      if (req.user.role === "patient") {
        let patient = null;
        if (req.user.patientId) {
          patient = await Patient.findById(req.user.patientId);
        } else {
          patient = await Patient.findOne({ email: req.user.email.toLowerCase().trim() });
        }

        if (!patient) {
          return res.status(400).json({
            success: false,
            error: "Patient profile not found for this account",
          });
        }
        patientId = patient._id;
      } else {
        if (!patientId) {
          return res.status(400).json({
            success: false,
            error: "Patient ID is required",
          });
        }
      }

      // Verify patient exists
      const patient = await Patient.findById(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          error: "Patient not found",
        });
      }

      // Create URLs for saved files
      const imageUrls = files.map(file => `/uploads/${file.filename}`);
      const thumbnailUrl = imageUrls[0] || "/placeholder.svg";

      // Create scan record in database
      const newScan = new Scan({
        patientId: patient._id,
        uploadedBy: req.user.id,
        status: "pending",
        imageUrls,
        thumbnailUrl,
        sliceCount: files.length,
        fileSize: files.reduce((acc, f) => acc + f.size, 0),
        format: path.extname(files[0].originalname).substring(1).toUpperCase() || "PNG",
        scanDate: new Date(),
        uploadedAt: new Date(),
        metadata: {
          modality: "CT",
          bodyPart: "HEAD",
          resolution: "512x512",
          sliceThickness: "5mm",
          originalFileName: files[0].originalname,
        },
      });

      await newScan.save();

      const scanObj = newScan.toObject();
      scanObj.id = scanObj._id;
      scanObj.patient = patient.toObject();
      scanObj.patient.id = scanObj.patient._id;

      res.status(201).json({
        success: true,
        data: scanObj,
      });
    } catch (error) {
      console.error("Upload scan error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
);

export default router;
