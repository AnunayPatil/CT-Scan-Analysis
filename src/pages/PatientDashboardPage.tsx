import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardService, scanService } from "@/services/api";
import type { PatientDashboardStats, CTScan } from "@/types";
import { CheckCircle2, Clock, FileText, Upload, User } from "lucide-react";

export default function PatientDashboardPage() {
  const statsQuery = useQuery({
    queryKey: ["patient-dashboard-stats"],
    queryFn: () => dashboardService.getPatientStats(),
  });

  const scansQuery = useQuery({
    queryKey: ["patient-dashboard-scans"],
    queryFn: () => scanService.getScans(),
    refetchInterval: 5000,
  });

  const stats = statsQuery.data?.data;
  const scans = scansQuery.data?.data?.data ?? [];
  const loading = statsQuery.isLoading || scansQuery.isLoading;

  const statCards = [
    {
      title: "Total Reports",
      value: stats?.totalReports,
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Completed",
      value: stats?.completedReports,
      icon: CheckCircle2,
      color: "text-success",
    },
    {
      title: "Total Scans",
      value: scans.length,
      icon: Upload,
      color: "text-warning",
    },
  ];

  const scanBadgeVariant = (status: CTScan["status"]) => {
    if (status === "completed") return "default";
    if (status === "analyzing") return "secondary";
    if (status === "failed") return "destructive";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Dashboard</h1>
          <p className="text-muted-foreground">
            Upload scans, track status, and view your results and reports.
          </p>
        </div>
        <Button asChild>
          <Link to="/patient/upload">
            <Upload className="mr-2 h-4 w-4" /> Upload Scan
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{stat.value ?? 0}</div>}
            </CardContent>
          </Card>
        ))}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profile</CardTitle>
            <User className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link to="/patient/profile">View profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Scans</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/patient/scans">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : scans.length === 0 ? (
                <div className="py-6 text-sm text-muted-foreground">
                  No scans yet. Upload a scan to begin.
                </div>
              ) : (
                scans.slice(0, 5).map((scan) => (
                  <Link
                    key={scan.id}
                    to={`/patient/scans/${scan.id}`}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">Scan #{scan.id.slice(0, 8)}</div>
                      <div className="text-sm text-muted-foreground">
                        Uploaded: {new Date(scan.uploadedAt ?? scan.scanDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={scanBadgeVariant(scan.status)} className="capitalize">
                      {scan.status}
                    </Badge>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : (stats?.recentReports?.length ?? 0) === 0 ? (
                <div className="py-6 text-sm text-muted-foreground">
                  Reports will appear here once your clinician finalizes them.
                </div>
              ) : (
                stats!.recentReports.map((report) => (
                  <Link
                    key={report.id}
                    to={`/patient/reports/${report.scanId}`}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium">{report.reportNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(report.generatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={report.status === "finalized" ? "default" : "secondary"} className="capitalize">
                      {report.status}
                    </Badge>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
