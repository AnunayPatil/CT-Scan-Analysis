import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { patientService } from "@/services/api";
import { ArrowLeft, Calendar, FileText, Upload, User, Activity, Brain } from "lucide-react";
import type { CTScan } from "@/types";

export default function DoctorPatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: response, isLoading } = useQuery({
    queryKey: ["patient-details", id],
    queryFn: () => patientService.getPatientById(id!),
    enabled: !!id,
  });

  const patient = response?.data;
  const scans = patient?.scans || [];
  const reports = patient?.reports || [];

  const getStatusBadge = (status: CTScan["status"]) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      analyzing: { variant: "secondary", label: "Analyzing" },
      completed: { variant: "default", label: "Completed" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const { variant, label } = variants[status] || { variant: "outline", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold">Patient Not Found</h2>
        <p className="text-muted-foreground mt-2">The patient you are looking for does not exist.</p>
        <Button className="mt-6" variant="outline" onClick={() => navigate("/doctor/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/doctor/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{patient.firstName} {patient.lastName}</h1>
          <p className="text-muted-foreground">ID: {patient.patientId}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => navigate("/doctor/upload")}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Scan
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Demographics Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Patient Demographics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Date of Birth</div>
              <div className="font-medium">{new Date(patient.dateOfBirth).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Gender</div>
              <div className="font-medium capitalize">{patient.gender}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{patient.email || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Contact</div>
              <div className="font-medium">{patient.contactNumber || "N/A"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Scan History and Reports */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Scan History
              </CardTitle>
              <CardDescription>{scans.length} scans recorded</CardDescription>
            </CardHeader>
            <CardContent>
              {scans.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No scans have been uploaded for this patient yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {scans.map((scan: any) => (
                    <div key={scan.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-4 gap-4">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          Scan #{scan.id.slice(0, 8)}
                          {getStatusBadge(scan.status)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(scan.scanDate).toLocaleDateString()}
                          </span>
                          {scan.result && (
                            <span className="flex items-center gap-1 text-primary">
                              <Brain className="h-3 w-3" />
                              {scan.result.prediction === 'normal' ? 'Normal' : <span className="text-destructive capitalize">{scan.result.prediction} detected</span>}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {scan.status === "completed" && (
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/doctor/results/${scan.id}`}>Results</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/doctor/report/${scan.id}`}>Report</Link>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
