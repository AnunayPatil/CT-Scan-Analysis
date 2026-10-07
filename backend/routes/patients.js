import express from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import Patient from "../models/Patient.js";
import Scan from "../models/Scan.js";
import AnalysisResult from "../models/AnalysisResult.js";
import Report from "../models/Report.js";

const router = express.Router();

/**
 * GET /api/v1/patients
 * List all patients (with optional search)
 * Allowed for: doctor, radiologist, admin
 */
router.get(
  "/",
  authenticateToken,
  requireRole("doctor", "radiologist", "admin"),
  async (req, res) => {
    try {
      const { search, page = 1, pageSize = 10 } = req.query;

      let filter = {};

      if (search) {
        const searchRegex = new RegExp(search, "i");
        filter = {
          $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { patientId: searchRegex },
            { email: searchRegex },
          ],
        };
      }

      const limit = parseInt(pageSize);
      const skip = (parseInt(page) - 1) * limit;

      const total = await Patient.countDocuments(filter);
      const patients = await Patient.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const patientsWithId = patients.map((p) => {
        const obj = p.toObject();
        obj.id = obj._id;
        return obj;
      });

      res.json({
        success: true,
        data: {
          data: patientsWithId,
          total,
          page: parseInt(page),
          pageSize: limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get patients error:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  }
);

/**
 * GET /api/v1/patients/:id
 * Get patient details, along with their scans and reports
 * Allowed for: doctor, radiologist, admin, and the patient themselves
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;

    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: "Patient not found",
      });
    }

    // Role-based access control
    if (userRole === "patient") {
      let loggedInPatient = null;
      if (req.user.patientId) {
        loggedInPatient = await Patient.findById(req.user.patientId);
      } else {
        loggedInPatient = await Patient.findOne({ email: req.user.email.toLowerCase().trim() });
      }

      if (patient._id !== loggedInPatient?._id) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }
    }

    const patientObj = patient.toObject();
    patientObj.id = patientObj._id;

    // Fetch related data
    const scans = await Scan.find({ patientId: patient._id }).sort({ createdAt: -1 });
    const reports = await Report.find({ patientId: patient._id }).sort({ createdAt: -1 });
    const analysisResults = await AnalysisResult.find({ 
      scanId: { $in: scans.map(s => s._id) } 
    });

    // Map scans with their results
    const mappedScans = scans.map(scan => {
      const scanObj = scan.toObject();
      scanObj.id = scanObj._id;
      
      const result = analysisResults.find(r => r.scanId === scanObj._id);
      if (result) {
        scanObj.result = result.toObject();
        scanObj.result.id = result._id;
      }
      return scanObj;
    });

    const mappedReports = reports.map(report => {
      const reportObj = report.toObject();
      reportObj.id = reportObj._id;
      return reportObj;
    });

    res.json({
      success: true,
      data: {
        ...patientObj,
        scans: mappedScans,
        reports: mappedReports,
      }
    });
  } catch (error) {
    console.error("Get patient details error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
