import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Scan from "../models/Scan.js";
import AnalysisResult from "../models/AnalysisResult.js";
import Report from "../models/Report.js";
import { mockUsers, mockPatients, mockScans, mockResults, mockReports } from "./mockData.js";

export const seedDatabase = async () => {
  try {
    // 1. Seed Patients
    const patientCount = await Patient.countDocuments();
    if (patientCount === 0) {
      console.log("🌱 Seeding patients...");
      const patientsToSeed = mockPatients.map(({ id, ...rest }) => ({
        _id: id,
        ...rest
      }));
      await Patient.insertMany(patientsToSeed);
      console.log(`✅ Seeded ${patientsToSeed.length} patients.`);
    }

    // 2. Seed Users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("🌱 Seeding users...");
      const hashedPassword = await bcrypt.hash("password123", 10);
      const usersToSeed = mockUsers.map(({ id, password, ...rest }) => ({
        _id: id,
        password: hashedPassword, // Hash "password123" securely
        ...rest
      }));
      await User.insertMany(usersToSeed);
      console.log(`✅ Seeded ${usersToSeed.length} users.`);
    }

    // 3. Seed Scans
    const scanCount = await Scan.countDocuments();
    if (scanCount === 0) {
      console.log("🌱 Seeding scans...");
      const scansToSeed = mockScans.map(({ id, ...rest }) => ({
        _id: id,
        ...rest
      }));
      await Scan.insertMany(scansToSeed);
      console.log(`✅ Seeded ${scansToSeed.length} scans.`);
    }

    // 4. Seed Analysis Results
    const resultCount = await AnalysisResult.countDocuments();
    if (resultCount === 0) {
      console.log("🌱 Seeding analysis results...");
      const resultsToSeed = mockResults.map(({ id, ...rest }) => ({
        _id: id,
        ...rest
      }));
      await AnalysisResult.insertMany(resultsToSeed);
      console.log(`✅ Seeded ${resultsToSeed.length} analysis results.`);
    }

    // 5. Seed Reports
    const reportCount = await Report.countDocuments();
    if (reportCount === 0) {
      console.log("🌱 Seeding reports...");
      const reportsToSeed = mockReports.map(({ id, ...rest }) => ({
        _id: id,
        ...rest
      }));
      await Report.insertMany(reportsToSeed);
      console.log(`✅ Seeded ${reportsToSeed.length} reports.`);
    }

    console.log("🌱 Database seeding check complete.");
  } catch (error) {
    console.error("❌ Database seeding error:", error);
  }
};
