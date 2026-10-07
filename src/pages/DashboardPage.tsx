import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardService } from "@/services/api";
import type { DashboardStats } from "@/types";
import {
  Activity,
  FileSearch,
  AlertTriangle,
  Clock,
  Upload,
  TrendingUp,
  Brain,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await dashboardService.getStats();
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
      title: "Today's Scans",
      value: stats?.todayScans,
      icon: TrendingUp,
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered brain stroke detection overview
          </p>
        </div>
        <Button asChild>
          <Link to="/upload">
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
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">
                  {stat.value?.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Model Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>CT Scan Analysis Model</CardTitle>
            <p className="text-sm text-muted-foreground">
              Active AI Engine • Version 2.0.0
            </p>
          </div>
          <div className="ml-auto flex gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">96.15%</div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-success">94.8%</div>
              <div className="text-xs text-muted-foreground">Sensitivity</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Recent Scans */}
      <Card>  
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              : stats?.recentScans.slice(0, 5).map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted" />
                      <div>
                        <p className="font-medium">
                          {scan.patient?.firstName} {scan.patient?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {scan.patient?.patientId}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        scan.status === "completed"
                          ? "default"
                          : scan.status === "analyzing"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {scan.status}
                    </Badge>
                  </div>
                ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
