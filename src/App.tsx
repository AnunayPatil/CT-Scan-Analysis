import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import DoctorDashboardPage from "@/pages/DoctorDashboardPage";
import PatientDashboardPage from "@/pages/PatientDashboardPage";
import PatientUploadPage from "@/pages/patient/PatientUploadPage";
import PatientScansPage from "@/pages/patient/PatientScansPage";
import PatientScanDetailPage from "@/pages/patient/PatientScanDetailPage";
import PatientReportPage from "@/pages/patient/PatientReportPage";
import PatientReportsPage from "@/pages/patient/PatientReportsPage";
import PatientProfilePage from "@/pages/patient/PatientProfilePage";
import UploadPage from "@/pages/UploadPage";
import ResultsListPage from "@/pages/ResultsListPage";
import ResultsPage from "@/pages/ResultsPage";
import ReportsListPage from "@/pages/ReportsListPage";
import ReportPage from "@/pages/ReportPage";
import ScanHistoryPage from "@/pages/ScanHistoryPage";
import DoctorPatientDetailPage from "@/pages/DoctorPatientDetailPage";
import CompliancePage from "@/pages/CompliancePage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Doctor routes */}
              <Route element={<ProtectedRoute allowedRoles={["doctor", "radiologist", "admin"]}><DashboardLayout /></ProtectedRoute>}>
                <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
                <Route path="/doctor/upload" element={<UploadPage />} />
                <Route path="/doctor/results" element={<ResultsListPage />} />
                <Route path="/doctor/results/:scanId" element={<ResultsPage />} />
                <Route path="/doctor/reports" element={<ReportsListPage />} />
                <Route path="/doctor/report/:scanId" element={<ReportPage />} />
                <Route path="/doctor/history" element={<ScanHistoryPage />} />
                <Route path="/doctor/patients/:id" element={<DoctorPatientDetailPage />} />
                <Route path="/doctor/compliance" element={<CompliancePage />} />
              </Route>

              {/* Patient routes */}
              <Route element={<ProtectedRoute allowedRoles={["patient"]}><DashboardLayout /></ProtectedRoute>}>
                <Route path="/patient/dashboard" element={<PatientDashboardPage />} />
                <Route path="/patient/upload" element={<PatientUploadPage />} />
                <Route path="/patient/scans" element={<PatientScansPage />} />
                <Route path="/patient/scans/:scanId" element={<PatientScanDetailPage />} />
                <Route path="/patient/reports" element={<PatientReportsPage />} />
                <Route path="/patient/reports/:scanId" element={<PatientReportPage />} />
                <Route path="/patient/profile" element={<PatientProfilePage />} />
              </Route>

              {/* Legacy routes - redirect based on role */}
              <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Navigate to="/doctor/dashboard" replace />} />
                <Route path="/upload" element={<Navigate to="/doctor/upload" replace />} />
                <Route path="/results" element={<Navigate to="/doctor/results" replace />} />
                <Route path="/results/:scanId" element={<ResultsPage />} />
                <Route path="/reports" element={<Navigate to="/doctor/reports" replace />} />
                <Route path="/report/:scanId" element={<ReportPage />} />
                <Route path="/history" element={<Navigate to="/doctor/history" replace />} />
                <Route path="/compliance" element={<Navigate to="/doctor/compliance" replace />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
