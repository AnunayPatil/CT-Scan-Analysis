import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { scanService } from "@/services/api";
import type { CTScan } from "@/types";
import { FileSearch, Upload } from "lucide-react";
import { format } from "date-fns";

const statusVariant = (status: CTScan["status"]) => {
  if (status === "completed") return "default";
  if (status === "analyzing") return "secondary";
  if (status === "failed") return "destructive";
  return "outline";
};

export default function PatientScansPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["patient-scans"],
    queryFn: () => scanService.getScans(),
    refetchInterval: 5000, // keep statuses fresh
  });

  const scans = data?.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Scans</h1>
          <p className="text-muted-foreground">Track upload and analysis status.</p>
        </div>
        <Button asChild>
          <Link to="/patient/upload">
            <Upload className="mr-2 h-4 w-4" /> Upload
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : scans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileSearch className="mb-4 h-16 w-16 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">No scans yet</h3>
            <p className="mb-4 text-center text-muted-foreground">
              Upload your CT images to begin the analysis workflow.
            </p>
            <Button asChild>
              <Link to="/patient/upload">Upload your first scan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {scans.map((scan) => (
            <Card key={scan.id} className="transition-all hover:shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-base">Scan #{scan.id.slice(0, 8)}</CardTitle>
                  <Badge variant={statusVariant(scan.status)} className="capitalize">
                    {scan.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  <div>{format(new Date(scan.uploadedAt ?? scan.scanDate), "PPP")}</div>
                  <div>{scan.sliceCount} slices</div>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/patient/scans/${scan.id}`}>View</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

