import express from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Scan from "../models/Scan.js";
import AnalysisResult from "../models/AnalysisResult.js";
import Report from "../models/Report.js";

const router = express.Router();

const diagnosisText = {
  normal: {
    finding: "AI-assisted CT analysis did not detect bleeding or ischemic changes in the submitted brain slice.",
    impression: "NORMAL CT BRAIN SLICE by AI analysis.",
    recommendations: "Clinical correlation recommended. Continue routine review as indicated.",
  },
  bleeding: {
    finding: "AI-assisted CT analysis detected findings consistent with intracranial bleeding in the submitted brain slice.",
    impression: "BLEEDING DETECTED with high AI confidence.",
    recommendations: "Urgent radiology and neurology review recommended. Correlate immediately with clinical status.",
  },
  ischemia: {
    finding: "AI-assisted CT analysis detected findings consistent with ischemic change in the submitted brain slice.",
    impression: "ISCHEMIA DETECTED with high AI confidence.",
    recommendations: "Urgent stroke-team evaluation recommended. Consider follow-up imaging and clinical correlation.",
  },
  stroke: {
    finding: "AI-assisted analysis detected abnormalities consistent with acute ischemic stroke.",
    impression: "ACUTE ISCHEMIC STROKE detected with high confidence.",
    recommendations: "Immediate neurology consultation recommended.",
  },
  other: {
    finding: "The uploaded image was not validated as a brain CT scan by the pre-inference image validator.",
    impression: "OTHER IMAGE TYPE. Brain CT diagnosis was not performed.",
    recommendations: "Upload a valid brain CT slice for analysis.",
  },
};

const getDiagnosisCopy = (prediction = "normal") =>
  diagnosisText[String(prediction).toLowerCase()] || diagnosisText.normal;

const objectId = (value) => value?._id || value;

import PDFDocument from "pdfkit";

const createReportPdf = ({ report, scan, result, patient }) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const confidence =
        result?.confidence <= 1
          ? `${(result.confidence * 100).toFixed(1)}%`
          : `${Number(result?.confidence || 0).toFixed(1)}%`;

      // Header
      doc.fontSize(20).text("CT Scan Analysis Report", { align: "center" });
      doc.moveDown();
      doc.fontSize(12).text(`Report Number: ${report.reportNumber}`);
      doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`);
      doc.moveDown();

      // Patient Info
      doc.fontSize(14).text("Patient Information", { underline: true });
      doc.fontSize(12).text(`Name: ${patient ? `${patient.firstName} ${patient.lastName}` : "N/A"}`);
      doc.text(`Patient ID: ${patient?.patientId || report.patientId}`);
      doc.text(`Scan ID: ${scan?._id || report.scanId}`);
      doc.moveDown();

      // Analysis Results
      doc.fontSize(14).text("AI Analysis Results", { underline: true });
      doc.fontSize(12).text(`Diagnosis: ${String(result?.prediction || "N/A").toUpperCase()}`);
      doc.text(`Confidence: ${confidence}`);
      doc.text(`Model: ${result?.modelName || "EfficientNet-B0 + BiLSTM"}`);
      doc.moveDown();

      // Clinical Details
      doc.fontSize(14).text("Clinical Details", { underline: true });
      doc.fontSize(12).text("Findings:");
      doc.text(report.findings, { indent: 20 });
      doc.moveDown();
      doc.text("Impression:");
      doc.text(report.impression, { indent: 20 });
      doc.moveDown();
      doc.text("Recommendations:");
      doc.text(report.recommendations, { indent: 20 });
      doc.moveDown(2);

      // Footer
      doc.fontSize(10).fillColor("gray")
         .text("Medical Disclaimer: This AI-generated report supports clinical review and does not replace a qualified radiologist or physician.", 
               { align: "center", width: 500 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// Helper function to map database objects for frontend compatibility
const mapReport = (report) => {
  if (!report) return null;
  const reportObj = report.toObject();
  reportObj.id = reportObj._id;
  
  if (reportObj.scanId) {
    const scanId = objectId(reportObj.scanId);
    if (typeof reportObj.scanId === "object") {
      reportObj.scan = reportObj.scanId;
      reportObj.scan.id = scanId;
    }
    reportObj.scanId = scanId;
  }
  if (reportObj.resultId) {
    const resultId = objectId(reportObj.resultId);
    if (typeof reportObj.resultId === "object") {
      reportObj.result = reportObj.resultId;
      reportObj.result.id = resultId;
    }
    reportObj.resultId = resultId;
  }
  if (reportObj.patientId) {
    const patientId = objectId(reportObj.patientId);
    if (typeof reportObj.patientId === "object") {
      reportObj.patient = reportObj.patientId;
      reportObj.patient.id = patientId;
    }
    reportObj.patientId = patientId;
  }
  
  return reportObj;
};

/**
 * GET /api/v1/reports
 * List reports (role-based filtering with database)
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let filter = {};

    // Role-based filtering
    if (userRole === "patient") {
      let patient = null;
      if (req.user.patientId) {
        patient = await Patient.findById(req.user.patientId);
      } else {
        patient = await Patient.findOne({ email: req.user.email.toLowerCase().trim() });
      }

      if (patient) {
        filter.patientId = patient._id;
      } else {
        return res.json({
          success: true,
          data: [],
        });
      }
    } else {
      // Doctors see reports for scans they uploaded
      const doctorScans = await Scan.find({ uploadedBy: userId });
      const doctorScanIds = doctorScans.map((s) => s._id);
      filter.scanId = { $in: doctorScanIds };
    }

    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .populate("scanId")
      .populate("resultId")
      .populate("patientId");

    const mappedReports = reports.map(mapReport);

    res.json({
      success: true,
      data: mappedReports,
    });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/v1/reports/scan/:scanId
 * Get report by scan ID
 */
router.get("/scan/:scanId", authenticateToken, async (req, res) => {
  try {
    const { scanId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await Report.findOne({ scanId })
      .populate("scanId")
      .populate("resultId")
      .populate("patientId");

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found",
      });
    }

    // Role-based access control
    if (userRole === "patient") {
      let patient = null;
      if (req.user.patientId) {
        patient = await Patient.findById(req.user.patientId);
      } else {
        patient = await Patient.findOne({ email: req.user.email.toLowerCase().trim() });
      }

      if (objectId(report.patientId) !== patient?._id) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }
    } else {
      const scan = await Scan.findById(scanId);
      if (scan?.uploadedBy !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }
    }

    res.json({
      success: true,
      data: mapReport(report),
    });
  } catch (error) {
    console.error("Get report by scan error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/v1/reports/:id/pdf
 * Download report PDF
 */
router.get("/:id/pdf", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await Report.findById(id)
      .populate("scanId")
      .populate("resultId")
      .populate("patientId");

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found",
      });
    }

    // Role-based access control
    if (userRole === "patient") {
      let patient = null;
      if (req.user.patientId) {
        patient = await Patient.findById(req.user.patientId);
      } else {
        patient = await Patient.findOne({ email: req.user.email.toLowerCase().trim() });
      }

      if (objectId(report.patientId) !== patient?._id) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }
    } else {
      const scan = await Scan.findById(objectId(report.scanId));
      if (scan?.uploadedBy !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }
    }

    const pdf = await createReportPdf({
      report,
      scan: report.scanId,
      result: report.resultId,
      patient: report.patientId,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${report.reportNumber || "report"}-${report._id}.pdf"`
    );
    res.send(pdf);
  } catch (error) {
    console.error("Download report PDF error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/v1/reports/:id
 * Get report by ID
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const report = await Report.findById(id)
      .populate("scanId")
      .populate("resultId")
      .populate("patientId");

    if (!report) {
      return res.status(404).json({
        success: false,
        error: "Report not found",
      });
    }

    // Role-based access control
    if (userRole === "patient") {
      let patient = null;
      if (req.user.patientId) {
        patient = await Patient.findById(req.user.patientId);
      } else {
        patient = await Patient.findOne({ email: req.user.email.toLowerCase().trim() });
      }

      if (objectId(report.patientId) !== patient?._id) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }
    } else {
      const scan = await Scan.findById(objectId(report.scanId));
      if (scan?.uploadedBy !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied",
        });
      }
    }

    res.json({
      success: true,
      data: mapReport(report),
    });
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/v1/reports/generate
 * Generate report (doctor only)
 */
router.post("/generate", authenticateToken, requireRole("doctor", "radiologist", "admin", "patient"), async (req, res) => {
  try {
    const { scanId, resultId } = req.body;

    if (!scanId || !resultId) {
      return res.status(400).json({
        success: false,
        error: "Scan ID and result ID are required",
      });
    }

    const scan = await Scan.findById(scanId);
    const result = await AnalysisResult.findById(resultId);

    if (!scan || !result) {
      return res.status(404).json({
        success: false,
        error: "Scan or result not found",
      });
    }

    // Check if report already exists
    const existingReport = await Report.findOne({ scanId });
    if (existingReport) {
      return res.status(409).json({
        success: false,
        error: "Report already exists for this scan",
      });
    }

    const copy = getDiagnosisCopy(result.prediction);
    const reportCount = await Report.countDocuments();
    const reportNumber = `RPT-${new Date().getFullYear()}-${String(reportCount + 1).padStart(4, "0")}`;

    const report = new Report({
      scanId,
      resultId,
      patientId: scan.patientId,
      reportNumber,
      generatedAt: new Date(),
      generatedBy: req.user.id,
      findings: copy.finding,
      impression: copy.impression,
      recommendations: copy.recommendations,
      status: "draft",
      pdfUrl: `/reports/report_${uuidv4().split("-")[0]}.pdf`,
    });

    await report.save();

    const populatedReport = await Report.findById(report._id)
      .populate("scanId")
      .populate("resultId")
      .populate("patientId");

    res.status(201).json({
      success: true,
      data: mapReport(populatedReport),
    });
  } catch (error) {
    console.error("Generate report error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
