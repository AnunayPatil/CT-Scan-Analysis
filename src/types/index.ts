// User & Authentication Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "doctor" | "radiologist" | "admin" | "patient";
  department?: string;
  specialization?: string;
  avatar?: string;
  createdAt: string;
  lastLogin: string;
  // Patient-specific fields
  patientId?: string; // For patients, link to Patient record
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: "doctor" | "radiologist";
  department?: string;
  specialization?: string;
}

// Patient Types
export interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  contactNumber?: string;
  email?: string;
  address?: string;
  medicalHistory?: string[];
  createdAt: string;
  updatedAt: string;
}

// Scan Types
export type ScanStatus = "pending" | "uploading" | "analyzing" | "completed" | "failed";
export type PredictionResult = "stroke" | "normal" | "bleeding" | "ischemia" | "other";

export interface CTScan {
  id: string;
  patientId: string;
  patient?: Patient;
  uploadedBy: string;
  uploadedByUser?: User;
  status: ScanStatus;
  imageUrls: string[];
  thumbnailUrl?: string;
  sliceCount: number;
  fileSize: number;
  format: "PNG" | "JPG" | "DICOM";
  scanDate: string;
  uploadedAt: string;
  analyzedAt?: string;
  metadata: ScanMetadata;
  result?: AnalysisResult;
}

export interface ScanMetadata {
  modality: string;
  bodyPart: string;
  resolution?: string;
  sliceThickness?: string;
  manufacturer?: string;
  institutionName?: string;
  studyDescription?: string;
}

// Analysis Results Types
export interface AnalysisResult {
  id: string;
  scanId: string;
  scan?: CTScan;
  prediction: PredictionResult;
  confidence: number;
  modelName: string;
  modelVersion: string;
  processingTime: number; // in milliseconds
  heatmapUrl?: string;
  overlayUrl?: string;
  affectedRegions?: AffectedRegion[];
  analyzedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface AffectedRegion {
  name: string;
  confidence: number;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Diagnostic Report Types
export interface DiagnosticReport {
  id: string;
  scanId: string;
  scan?: CTScan;
  resultId: string;
  result?: AnalysisResult;
  patientId: string;
  patient?: Patient;
  reportNumber: string;
  generatedAt: string;
  generatedBy: string;
  findings: string;
  impression: string;
  recommendations?: string;
  radiologistSignature?: string;
  status: "draft" | "finalized" | "amended";
  pdfUrl?: string;
}

// Dashboard Statistics Types
export interface DashboardStats {
  totalScans: number;
  analyzedScans: number;
  positiveStrokeCases: number;
  pendingScans: number;
  todayScans: number;
  weeklyTrend: TrendData[];
  recentScans: CTScan[];
}

// Patient Dashboard Statistics (simpler)
export interface PatientDashboardStats {
  totalReports: number;
  completedReports: number;
  pendingReports: number;
  recentReports: DiagnosticReport[];
}

export interface TrendData {
  date: string;
  scans: number;
  strokeDetected: number;
  normal: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Upload Types
export interface UploadProgress {
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

// Filter & Search Types
export interface ScanFilters {
  status?: ScanStatus;
  prediction?: PredictionResult;
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
  search?: string;
}

// Model Information Types
export interface ModelInfo {
  name: string;
  version: string;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  architecture: string;
  trainingDataset: string;
  lastUpdated: string;
}

export interface PredictionResponse {
  class_index: number | null;
  predicted_class: string;
  prediction?: string;
  confidence: number;
  probabilities: Record<string, number>;
  validation?: {
    label: string;
    scores: Record<string, number>;
  };
  processing_time_ms: number;
  scan?: CTScan;
  result?: AnalysisResult;
}
