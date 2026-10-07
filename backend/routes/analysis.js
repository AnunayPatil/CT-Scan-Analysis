import express from "express";
import { authenticateToken, requireRole } from "../middleware/auth.js";
import Scan from "../models/Scan.js";
import AnalysisResult from "../models/AnalysisResult.js";

const router = express.Router();

/**
 * POST /api/v1/analysis/analyze/:scanId
 * Trigger scan analysis (mocked async, but saved in MongoDB)
 */
router.post("/analyze/:scanId", authenticateToken, requireRole("doctor", "radiologist", "admin"), async (req, res) => {
  try {
    const { scanId } = req.params;

    const scan = await Scan.findById(scanId);
    if (!scan) {
      return res.status(404).json({
        success: false,
        error: "Scan not found",
      });
    }

    // Update scan status
    scan.status = "analyzing";
    scan.analyzedAt = new Date();
    await scan.save();

    // Simulate analysis delay (in production, this would trigger ML model)
    setTimeout(async () => {
      try {
        // Fetch fresh scan ref
        const activeScan = await Scan.findById(scanId);
        if (!activeScan) return;

        // Check if result already exists to prevent duplicate key errors
        const existingResult = await AnalysisResult.findOne({ scanId });
        if (existingResult) {
          activeScan.status = "completed";
          await activeScan.save();
          return;
        }

        // Generate deterministic pseudo-random outcome based on scanId
        // This ensures the same scan always yields the same result while avoiding Math.random
        const charSum = scanId.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const isStroke = (charSum % 10) > 6; // 30% chance of stroke
        const confidence = 85 + (charSum % 12) + ((charSum % 10) / 10); // 85.0 to 96.9

        const result = new AnalysisResult({
          scanId,
          prediction: isStroke ? "stroke" : "normal",
          confidence: parseFloat(confidence.toFixed(1)),
          probabilities: {
            Normal: isStroke ? 15 : 85,
            Bleeding: isStroke ? 40 : 5,
            Ischemia: isStroke ? 45 : 10,
          },
          modelName: "CNN-GA-BiLSTM Hybrid Model",
          modelVersion: "2.1.0",
          processingTime: 2340 + (charSum % 500),
          heatmapUrl: activeScan.imageUrls && activeScan.imageUrls.length > 0 ? activeScan.imageUrls[0] : "/placeholder.svg",
          overlayUrl: activeScan.imageUrls && activeScan.imageUrls.length > 0 ? activeScan.imageUrls[0] : "/placeholder.svg",
          analyzedAt: new Date(),
        });

        await result.save();
        
        activeScan.status = "completed";
        await activeScan.save();
      } catch (err) {
        console.error("Async analysis simulation failed:", err);
      }
    }, 2000); // 2 second delay

    res.json({
      success: true,
      data: {
        message: "Analysis started",
        scanId,
        status: "analyzing",
      },
    });
  } catch (error) {
    console.error("Analyze scan error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/v1/analysis/result/:scanId
 * Get analysis result
 */
router.get("/result/:scanId", authenticateToken, async (req, res) => {
  try {
    const { scanId } = req.params;

    const result = await AnalysisResult.findOne({ scanId });
    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Analysis result not found",
      });
    }

    const scan = await Scan.findById(scanId);
    
    const resultObj = result.toObject();
    resultObj.id = resultObj._id;
    if (scan) {
      resultObj.scan = scan.toObject();
      resultObj.scan.id = resultObj.scan._id;
    }

    res.json({
      success: true,
      data: resultObj,
    });
  } catch (error) {
    console.error("Get result error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;
