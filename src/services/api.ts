import type {
  ApiResponse,
  PaginatedResponse,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  CTScan,
  AnalysisResult,
  DiagnosticReport,
  DashboardStats,
  PatientDashboardStats,
  ScanFilters,
  Patient,
  ModelInfo,
  PredictionResponse,
} from "@/types";
import {
  mockUsers,
  mockPatients,
  mockScans,
  mockResults,
  mockReports,
  mockDashboardStats,
  mockModelInfo,
  simulateApiDelay,
} from "./mockData";

// Base API URL - points to backend server
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";
const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, "");

export const assetUrl = (url?: string) => {
  if (!url) return "/placeholder.svg";
  if (/^https?:\/\//i.test(url)) return url;
  return `${ASSET_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

// Simulated token storage
let currentToken: string | null = localStorage.getItem("auth_token");
let currentUser: User | null = null;

// Helper to get auth headers
const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = localStorage.getItem("auth_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

// Helper to handle API responses
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  let data;
  try {
    const text = await response.text();
    if (!text) {
      throw new Error("Empty response from server");
    }
    data = JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON response: ${response.status} ${response.statusText}`);
    }
    throw error;
  }

  if (!response.ok) {
    const errorMessage = data.error || data.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
};

// ============ AUTH SERVICES ============

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await handleResponse<AuthResponse>(response);

      // Store token
      if (data.data.accessToken) {
        localStorage.setItem("auth_token", data.data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.data.user));
      }

      return data;
    } catch (error) {
      // Re-throw with more context
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Cannot connect to server. Please make sure the backend is running on http://localhost:3001");
      }
      throw error;
    }
  },

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await handleResponse<AuthResponse>(response);

      // Store token
      if (result.data.accessToken) {
        localStorage.setItem("auth_token", result.data.accessToken);
        localStorage.setItem("user", JSON.stringify(result.data.user));
      }

      return result;
    } catch (error) {
      // Re-throw with more context
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Cannot connect to server. Please make sure the backend is running on http://localhost:3001");
      }
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse<User>(response);
  },

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    await simulateApiDelay(200);
    const newToken = `mock_jwt_${Date.now()}_refresh`;
    currentToken = newToken;
    localStorage.setItem("auth_token", newToken);
    return { success: true, data: { accessToken: newToken } };
  },
};

// ============ SCAN SERVICES ============

export const scanService = {
  async getScans(filters?: ScanFilters): Promise<ApiResponse<PaginatedResponse<CTScan>>> {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.patientId) params.append("patientId", filters.patientId);
    if (filters?.search) params.append("search", filters.search);
    params.append("page", "1");
    params.append("pageSize", "10");

    const response = await fetch(`${API_BASE_URL}/scans?${params.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse<PaginatedResponse<CTScan>>(response);
  },

  async getScanById(id: string): Promise<ApiResponse<CTScan>> {
    const response = await fetch(`${API_BASE_URL}/scans/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse<CTScan>(response);
  },

  async uploadScan(files: File[], patientId: string): Promise<ApiResponse<CTScan>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("patientId", patientId);

    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/scans/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    return handleResponse<CTScan>(response);
  },

  // Patient-initiated upload (backend resolves patient identity from token)
  async uploadScanAsPatient(files: File[]): Promise<ApiResponse<CTScan>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/scans/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    return handleResponse<CTScan>(response);
  },

  async analyzeScan(scanId: string): Promise<ApiResponse<AnalysisResult>> {
    const response = await fetch(`${API_BASE_URL}/analysis/analyze/${scanId}`, {
      method: "POST",
      headers: getAuthHeaders(),
    });

    return handleResponse<AnalysisResult>(response);
  },

  async getAnalysisResult(scanId: string): Promise<ApiResponse<AnalysisResult>> {
    const response = await fetch(`${API_BASE_URL}/analysis/result/${scanId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse<AnalysisResult>(response);
  },

  async getHeatmap(resultId: string): Promise<ApiResponse<{ original: string; heatmap: string; overlay: string }>> {
    // Backwards-compat helper: fetch result and adapt URLs.
    // Prefer using `getAnalysisResult(scanId)` in new code.
    const response = await fetch(`${API_BASE_URL}/analysis/result/${resultId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    const result = await handleResponse<AnalysisResult>(response);
    return {
      success: true,
      data: {
        original: "/placeholder.svg",
        heatmap: result.data.heatmapUrl || "/placeholder.svg",
        overlay: result.data.overlayUrl || "/placeholder.svg",
      },
    };
  },
};

// ============ PATIENT SERVICES ============

export const patientService = {
  async getPatients(search?: string): Promise<ApiResponse<PaginatedResponse<Patient>>> {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    params.append("page", "1");
    params.append("pageSize", "100"); // Retrieving 100 for simplicity in the demo

    const response = await fetch(`${API_BASE_URL}/patients?${params.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse<PaginatedResponse<Patient>>(response);
  },

  async getPatientById(id: string): Promise<ApiResponse<Patient & { scans?: CTScan[], reports?: DiagnosticReport[] }>> {
    const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse<Patient & { scans?: CTScan[], reports?: DiagnosticReport[] }>(response);
  },

  async getPatientScans(patientId: string): Promise<ApiResponse<CTScan[]>> {
    const params = new URLSearchParams();
    params.append("patientId", patientId);
    
    const response = await fetch(`${API_BASE_URL}/scans?${params.toString()}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    
    const paginatedResponse = await handleResponse<PaginatedResponse<CTScan>>(response);
    return { success: true, data: paginatedResponse.data.data };
  },
};

// ============ REPORT SERVICES ============

export const reportService = {
  async getReports(): Promise<ApiResponse<DiagnosticReport[]>> {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse<DiagnosticReport[]>(response);
  },

  async getReportById(id: string): Promise<ApiResponse<DiagnosticReport>> {
    const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse<DiagnosticReport>(response);
  },

  async getReportByScanId(scanId: string): Promise<ApiResponse<DiagnosticReport>> {
    const response = await fetch(`${API_BASE_URL}/reports/scan/${scanId}`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse<DiagnosticReport>(response);
  },

  async generateReport(scanId: string, resultId: string): Promise<ApiResponse<DiagnosticReport>> {
    const response = await fetch(`${API_BASE_URL}/reports/generate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ scanId, resultId }),
    });

    return handleResponse<DiagnosticReport>(response);
  },

  async downloadReportPdf(reportId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}/pdf`, {
      method: "GET",
      headers: (() => {
        const token = localStorage.getItem("auth_token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        return headers;
      })(),
    });
    if (!response.ok) {
      // try to parse json error
      try {
        const err = await response.json();
        throw new Error(err.error || "Failed to download report PDF");
      } catch {
        throw new Error("Failed to download report PDF");
      }
    }
    return await response.blob();
  },
};

// ============ DASHBOARD SERVICES ============

export const dashboardService = {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse<DashboardStats>(response);
  },

  async getPatientStats(): Promise<ApiResponse<PatientDashboardStats>> {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return handleResponse<PatientDashboardStats>(response);
  },
};

// ============ MODEL SERVICES ============

export const modelService = {
  async getModelInfo(): Promise<ApiResponse<ModelInfo>> {
    await simulateApiDelay(300);
    return { success: true, data: mockModelInfo };
  },
};

export const predictionService = {
  async predict(image: File, patientId?: string): Promise<ApiResponse<PredictionResponse>> {
    const formData = new FormData();
    formData.append("image", image);
    if (patientId) {
      formData.append("patientId", patientId);
    }

    const token = localStorage.getItem("auth_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers,
      body: formData,
    });

    return handleResponse<PredictionResponse>(response);
  },
};

// Export all services
export const api = {
  auth: authService,
  scan: scanService,
  patient: patientService,
  report: reportService,
  dashboard: dashboardService,
  model: modelService,
  prediction: predictionService,
};

export default api;
