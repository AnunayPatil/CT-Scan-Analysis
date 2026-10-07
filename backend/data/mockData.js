// Mock data for development
// In production, this would be replaced with database queries

export const mockUsers = [
  {
    id: "usr_001",
    email: "dr.sarah.johnson@hospital.org",
    password: "$2a$10$dummy", // In real app, use bcrypt hash
    firstName: "Sarah",
    lastName: "Johnson",
    role: "radiologist",
    department: "Radiology",
    specialization: "Neuroradiology",
    createdAt: "2024-01-15T08:00:00Z",
    lastLogin: "2025-01-18T09:30:00Z",
  },
  {
    id: "usr_002",
    email: "dr.michael.chen@hospital.org",
    password: "$2a$10$dummy",
    firstName: "Michael",
    lastName: "Chen",
    role: "doctor",
    department: "Neurology",
    specialization: "Stroke Medicine",
    createdAt: "2024-02-20T10:00:00Z",
    lastLogin: "2025-01-17T14:45:00Z",
  },
  {
    id: "usr_003",
    email: "patient.john@example.com",
    password: "$2a$10$dummy",
    firstName: "John",
    lastName: "Smith",
    role: "patient",
    patientId: "pat_001",
    createdAt: "2025-01-10T08:00:00Z",
    lastLogin: "2025-01-20T10:00:00Z",
  },
];

export const mockPatients = [
  {
    id: "pat_001",
    patientId: "P-2025-0001",
    firstName: "John",
    lastName: "Smith",
    dateOfBirth: "1965-03-15",
    gender: "male",
    contactNumber: "+1-555-0101",
    email: "john.smith@email.com",
    createdAt: "2025-01-10T08:00:00Z",
    updatedAt: "2025-01-10T08:00:00Z",
  },
  {
    id: "pat_002",
    patientId: "P-2025-0002",
    firstName: "Emily",
    lastName: "Davis",
    dateOfBirth: "1978-07-22",
    gender: "female",
    contactNumber: "+1-555-0102",
    email: "emily.davis@email.com",
    createdAt: "2025-01-12T10:30:00Z",
    updatedAt: "2025-01-12T10:30:00Z",
  },
];

export const mockScans = [
  {
    id: "scan_001",
    patientId: "pat_001",
    uploadedBy: "usr_002",
    status: "completed",
    imageUrls: ["/placeholder.svg"],
    sliceCount: 24,
    fileSize: 5242880,
    format: "DICOM",
    scanDate: "2025-01-15T10:00:00Z",
    uploadedAt: "2025-01-15T10:05:00Z",
    analyzedAt: "2025-01-15T10:07:00Z",
    metadata: {
      modality: "CT",
      bodyPart: "HEAD",
      resolution: "512x512",
      sliceThickness: "5mm",
    },
  },
  {
    id: "scan_002",
    patientId: "pat_002",
    uploadedBy: "usr_001",
    status: "analyzing",
    imageUrls: ["/placeholder.svg"],
    sliceCount: 30,
    fileSize: 6291456,
    format: "DICOM",
    scanDate: "2025-01-18T14:00:00Z",
    uploadedAt: "2025-01-18T14:05:00Z",
    metadata: {
      modality: "CT",
      bodyPart: "HEAD",
      resolution: "512x512",
      sliceThickness: "5mm",
    },
  },
];

export const mockResults = [
  {
    id: "result_001",
    scanId: "scan_001",
    prediction: "stroke",
    confidence: 92.5,
    modelName: "CNN-GA-BiLSTM Hybrid Model",
    modelVersion: "2.1.0",
    processingTime: 2340,
    heatmapUrl: "/placeholder.svg",
    overlayUrl: "/placeholder.svg",
    analyzedAt: "2025-01-15T10:07:00Z",
  },
];

export const mockReports = [
  {
    id: "report_001",
    scanId: "scan_001",
    resultId: "result_001",
    patientId: "pat_001",
    reportNumber: "RPT-2025-0001",
    generatedAt: "2025-01-15T10:10:00Z",
    generatedBy: "usr_001",
    findings: "AI-assisted analysis detected abnormalities consistent with acute ischemic stroke.",
    impression: "ACUTE ISCHEMIC STROKE detected with high confidence.",
    recommendations: "Immediate neurology consultation recommended.",
    status: "finalized",
    pdfUrl: "/reports/report_001.pdf",
  },
];
