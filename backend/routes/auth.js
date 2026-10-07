import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Patient from "../models/Patient.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

/**
 * POST /api/v1/auth/login
 * Login user
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      });
    }

    // Find user in database
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Generate JWT token
    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    if (user.patientId) {
      tokenPayload.patientId = user.patientId;
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Return user details without password
    const userObj = user.toObject();
    delete userObj.password;

    // Map _id to id for frontend compatibility
    userObj.id = userObj._id;

    res.json({
      success: true,
      data: {
        user: userObj,
        accessToken: token,
        refreshToken: `refresh_${token}`,
        expiresIn: 24 * 60 * 60,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /api/v1/auth/register
 * Register new user
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, department, specialization, dateOfBirth, gender } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        error: "Required fields: email, password, firstName, lastName, role",
      });
    }

    // Validate role
    const validRoles = ["doctor", "radiologist", "patient"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Role must be one of: ${validRoles.join(", ")}`,
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "Email already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user object
    const userObj = {
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      firstName,
      lastName,
      role,
      department: role !== "patient" ? department : undefined,
      specialization: role !== "patient" ? specialization : undefined,
    };

    // If patient, create patient record first
    let patientId = null;
    if (role === "patient") {
      const patientCount = await Patient.countDocuments();
      const formattedSeq = String(patientCount + 1).padStart(4, "0");
      
      const newPatient = new Patient({
        patientId: `P-2025-${formattedSeq}`,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth || new Date().toISOString().split("T")[0],
        gender: gender || "other",
        email: email.toLowerCase().trim(),
      });

      await newPatient.save();
      patientId = newPatient._id;
      userObj.patientId = patientId;
    }

    const newUser = new User(userObj);
    await newUser.save();

    // Generate JWT token
    const tokenPayload = {
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    };
    
    if (newUser.patientId) {
      tokenPayload.patientId = newUser.patientId;
    }
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // Remove password from response
    const newUserObj = newUser.toObject();
    delete newUserObj.password;
    newUserObj.id = newUserObj._id;

    res.status(201).json({
      success: true,
      data: {
        user: newUserObj,
        accessToken: token,
        refreshToken: `refresh_${token}`,
        expiresIn: 24 * 60 * 60,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout user
 */
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * GET /api/v1/auth/me
 * Get current user
 */
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const userObj = user.toObject();
    delete userObj.password;
    userObj.id = userObj._id;

    res.json({
      success: true,
      data: userObj,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid token",
    });
  }
});

export default router;
