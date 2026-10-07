import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { scanService } from "@/services/api";
import { AlertTriangle, CheckCircle, Eye, FileText, Brain } from "lucide-react";
import { format } from "date-fns";

export default function ResultsListPage() {
  const { data: scansData, isLoading } = useQuery({
    queryKey: ["scans", "completed"],
    queryFn: () => scanService.getScans({ status: "completed" }),
  });

  const analyzedScans = scansData?.data?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analysis Results</h1>
          <p className="text-muted-foreground">View all completed scan analyses</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analysis Results</h1>
          <p className="text-muted-foreground">View all completed scan analyses</p>
        </div>
        <Button asChild>
          <Link to="/doctor/upload">New Scan</Link>
        </Button>
      </div>

      {analyzedScans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Brain className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Upload and analyze CT scans to see results here.
            </p>
            <Button asChild>
              <Link to="/doctor/upload">Upload Your First Scan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {analyzedScans.map((scan) => {
            const prediction = scan.result?.prediction || "normal";
            const isStroke = prediction === "stroke" || prediction === "bleeding" || prediction === "ischemia";
            const confidence = scan.result?.confidence || 0;

            return (
              <Card
                key={scan.id}
                className={`transition-all hover:shadow-md ${
                  isStroke ? "border-destructive/30" : "border-success/30"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={isStroke ? "destructive" : "default"}>
                      {prediction.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {confidence > 0 ? `${confidence.toFixed(1)}% confidence` : "Analyzing..."}
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-2">
                    {scan.patient?.firstName} {scan.patient?.lastName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(scan.scanDate), "PPP")}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isStroke ? "bg-destructive/20" : "bg-success/20"
                      }`}
                    >
                      {isStroke ? (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-success" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {isStroke ? "Abnormality Detected" : "No Abnormality"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {scan.metadata?.bodyPart} • {scan.sliceCount} slices
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    
                    <Button asChild size="sm" className="flex-1">
                      <Link to={`/doctor/report/${scan.id}`}>
                        <FileText className="mr-1 h-3 w-3" /> Report
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

