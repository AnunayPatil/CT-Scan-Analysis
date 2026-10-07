import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { dashboardService, patientService } from "@/services/api";
import type { DashboardStats, Patient } from "@/types";
import {
  Activity,
  FileSearch,
  AlertTriangle,
  Clock,
  Upload,
  Search,
  Users,
  ChevronRight
} from "lucide-react";

export default function DoctorDashboardPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardService.getStats(),
  });

  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ["patients", searchTerm],
    queryFn: () => patientService.getPatients(searchTerm),
  });

  const stats = statsData?.data;
  const patients = patientsData?.data?.data || [];

  const statCards = [
    {
      title: "Total Scans",
      value: stats?.totalScans,
      icon: FileSearch,
      color: "text-primary",
    },
    {
      title: "Analyzed",
      value: stats?.analyzedScans,
      icon: Activity,
      color: "text-success",
    },
    {
      title: "Stroke Detected",
      value: stats?.positiveStrokeCases,
      icon: AlertTriangle,
      color: "text-destructive",
    },
    {
      title: "Pending Scans",
      value: stats?.pendingScans,
      icon: Clock,
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered brain stroke detection overview
          </p>
        </div>
        <Button asChild>
          <Link to="/doctor/upload">
            <Upload className="mr-2 h-4 w-4" /> New Scan
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {stat.value?.toLocaleString() || 0}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Patient Directory */}
        <div className="md:col-span-2 space-y-4">
          <Card className="h-full">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Patient Directory
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search patients..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[500px] overflow-auto">
                {loadingPatients ? (
                   Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  ))
                ) : patients.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No patients found.
                  </div>
                ) : (
                  patients.map((patient: Patient) => (
                    <div
                      key={patient.id}
                      className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground flex gap-2">
                            <span>ID: {patient.patientId}</span>
                            <span>•</span>
                            <span className="capitalize">{patient.gender}, {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}y</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="hidden sm:flex">
                        View History <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Model Info & Recent Scans */}
        <div className="md:col-span-1 space-y-6">

          <Card>  
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loadingStats
                  ? Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))
                  : stats?.recentScans.slice(0, 4).map((scan) => (
                      <div
                        key={scan.id}
                        className="flex flex-col gap-1 border-b pb-3 last:border-0 last:pb-0"
                      >
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-medium">
                            {scan.patient?.firstName} {scan.patient?.lastName}
                          </p>
                           <Badge
                            variant={
                              scan.status === "completed"
                                ? "default"
                                : scan.status === "analyzing"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-[10px] px-1.5 h-4"
                          >
                            {scan.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex justify-between">
                          <span>{scan.patient?.patientId}</span>
                          <span>{new Date(scan.uploadedAt || scan.scanDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
              </div>
              <Button asChild variant="outline" className="w-full mt-4" size="sm">
                <Link to="/doctor/history">View All Scans</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
