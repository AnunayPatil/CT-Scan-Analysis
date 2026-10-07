import express from "express";
import { authenticateToken } from "../middleware/auth.js";
import Patient from "../models/Patient.js";
import Scan from "../models/Scan.js";
import AnalysisResult from "../models/AnalysisResult.js";
import Report from "../models/Report.js";

const router = express.Router();

/**
 * GET /api/v1/dashboard/stats
 * Get dashboard statistics (role-based)
 */
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === "patient") {
      // 1. Patient dashboard stats
      let patient = null;
      if (req.user.patientId) {
        patient = await Patient.findById(req.user.patientId);
      } else {
        patient = await Patient.findOne({ email: req.user.email.toLowerCase().trim() });
      }

      const patientId = patient?._id || "non_existent_id";
      
      const totalReports = await Report.countDocuments({ patientId });
      const completedReports = await Report.countDocuments({ patientId, status: "finalized" });
      const pendingReports = await Report.countDocuments({ patientId, status: "draft" });

      const recentReports = await Report.find({ patientId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("scanId")
        .populate("resultId")
        .populate("patientId");

      const mappedReports = recentReports.map((report) => {
        const reportObj = report.toObject();
        reportObj.id = reportObj._id;
        if (reportObj.scanId && typeof reportObj.scanId === 'object') {
          reportObj.scan = reportObj.scanId;
          reportObj.scan.id = reportObj.scan._id;
        }
        if (reportObj.resultId && typeof reportObj.resultId === 'object') {
          reportObj.result = reportObj.resultId;
          reportObj.result.id = reportObj.result._id;
        }
        if (reportObj.patientId && typeof reportObj.patientId === 'object') {
          reportObj.patient = reportObj.patientId;
          reportObj.patient.id = reportObj.patient._id;
        }
        return reportObj;
      });

      const stats = {
        totalReports,
        completedReports,
        pendingReports,
        recentReports: mappedReports,
      };

      return res.json({
        success: true,
        data: stats,
      });
    }

    // 2. Doctor dashboard stats
    const doctorScansCount = await Scan.countDocuments({ uploadedBy: userId });
    
    // Get all scan IDs uploaded by this doctor to count corresponding results
    const doctorScans = await Scan.find({ uploadedBy: userId }, "_id");
    const doctorScanIds = doctorScans.map((s) => s._id);

    const analyzedScansCount = await AnalysisResult.countDocuments({ scanId: { $in: doctorScanIds } });
    const positiveStrokeCasesCount = await AnalysisResult.countDocuments({ 
      scanId: { $in: doctorScanIds }, 
      prediction: { $in: ["Bleeding", "Ischemia", "bleeding", "ischemia", "stroke"] } 
    });
    const pendingScansCount = await Scan.countDocuments({ 
      uploadedBy: userId, 
      status: { $in: ["pending", "analyzing"] } 
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayScansCount = await Scan.countDocuments({
      uploadedBy: userId,
      createdAt: { $gte: startOfToday }
    });

    const recentScans = await Scan.find({ uploadedBy: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("patientId");

    const mappedScans = recentScans.map((scan) => {
      const scanObj = scan.toObject();
      scanObj.id = scanObj._id;
      if (scanObj.patientId && typeof scanObj.patientId === 'object') {
        scanObj.patient = scanObj.patientId;
        scanObj.patient.id = scanObj.patient._id;
      }
      return scanObj;
    });

    // Calculate weekly trend (last 7 days)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const dateStart = new Date();
      dateStart.setHours(0, 0, 0, 0);
      dateStart.setDate(dateStart.getDate() - i);
      
      const dateEnd = new Date(dateStart);
      dateEnd.setHours(23, 59, 59, 999);
      
      const count = await Scan.countDocuments({
        uploadedBy: userId,
        createdAt: { $gte: dateStart, $lte: dateEnd }
      });
      weeklyTrend.push(count);
    }

    const stats = {
      totalScans: doctorScansCount,
      analyzedScans: analyzedScansCount,
      positiveStrokeCases: positiveStrokeCasesCount,
      pendingScans: pendingScansCount,
      todayScans: todayScansCount,
      weeklyTrend: weeklyTrend,
      recentScans: mappedScans,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
