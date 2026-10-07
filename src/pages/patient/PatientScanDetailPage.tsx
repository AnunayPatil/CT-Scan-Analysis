import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { assetUrl, scanService, reportService } from "@/services/api";
import { ArrowLeft, FileText, Image as ImageIcon, Loader2 } from "lucide-react";

export default function PatientScanDetailPage() {
  const { scanId } = useParams();
  const navigate = useNavigate();

  const scanQuery = useQuery({
    queryKey: ["patient-scan", scanId],
    queryFn: () => scanService.getScanById(scanId!),
    enabled: !!scanId,
    refetchInterval: 5000,
  });

  const scan = scanQuery.data?.data;

  const resultQuery = useQuery({
    queryKey: ["patient-scan-result", scanId],
    queryFn: () => scanService.getAnalysisResult(scanId!),
    enabled: !!scanId && scan?.status === "completed",
  });

  const reportQuery = useQuery({
    queryKey: ["patient-scan-report", scanId],
    queryFn: () => reportService.getReportByScanId(scanId!),
    enabled: !!scanId,
    retry: false,
  });

  if (scanQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Scan not found.</p>
        <Button asChild variant="outline">
          <Link to="/patient/scans">Back to My Scans</Link>
        </Button>
      </div>
    );
  }

  const status = scan.status;
  const statusHint =
    status === "pending"
      ? "We received your scan. Analysis will begin soon."
      : status === "analyzing"
        ? "Analysis is in progress. This may take a few minutes."
        : status === "completed"
          ? "Analysis is complete. Final diagnosis will be confirmed in your report."
          : status === "failed"
            ? "There was a problem processing this scan. Please contact support."
            : "Status updated.";

  const result = resultQuery.data?.data;
  const hasResult = !!result;
  const originalImage = assetUrl(scan.imageUrls?.[0]);
  const heatmapImage = assetUrl(result?.heatmapUrl || scan.imageUrls?.[0]);
  const overlayImage = assetUrl(result?.overlayUrl || scan.imageUrls?.[0]);
  const confidence =
    result?.confidence == null
      ? "-"
      : result.confidence <= 1
        ? `${(result.confidence * 100).toFixed(1)}%`
        : `${result.confidence.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Scan #{scan.id.slice(0, 8)}</h1>
            <p className="text-muted-foreground">{statusHint}</p>
          </div>
        </div>
        <Badge className="capitalize" variant={status === "completed" ? "default" : status === "failed" ? "destructive" : status === "analyzing" ? "secondary" : "outline"}>
          {status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {status !== "completed" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>We’ll refresh this page automatically.</span>
            </div>
          )}
          <div className="ml-auto flex gap-2">
            {reportQuery.data?.data?.id ? (
              <Button asChild>
                <Link to={`/patient/reports/${scan.id}`}>
                  <FileText className="mr-2 h-4 w-4" /> View Report
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/patient/dashboard">Go to Dashboard</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Results (read-only)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status !== "completed" ? (
            <p className="text-sm text-muted-foreground">
              Results will appear here once analysis is completed.
            </p>
          ) : resultQuery.isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : !hasResult ? (
            <p className="text-sm text-muted-foreground">
              Result not available yet. Please check again soon.
            </p>
          ) : (
            <>
              <div className="rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">Preliminary classification</div>
                <div className="mt-1 text-2xl font-bold">
                  {result.prediction}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Confidence: {confidence}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Final diagnosis is confirmed by your clinician and shown in the report.
                </div>
              </div>

              <Tabs defaultValue="overlay">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="original">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Original
                  </TabsTrigger>
                  <TabsTrigger value="heatmap">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Heatmap
                  </TabsTrigger>
                  <TabsTrigger value="overlay">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Overlay
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="original" className="mt-4">
                  <div className="overflow-hidden rounded-lg border bg-muted">
                    <img src={originalImage} alt="Original" className="w-full object-contain" />
                  </div>
                </TabsContent>
                <TabsContent value="heatmap" className="mt-4">
                  <div className="overflow-hidden rounded-lg border bg-muted">
                    <img src={heatmapImage} alt="Heatmap" className="w-full object-contain" />
                  </div>
                </TabsContent>
                <TabsContent value="overlay" className="mt-4">
                  <div className="overflow-hidden rounded-lg border bg-muted">
                    <img src={overlayImage} alt="Overlay" className="w-full object-contain" />
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

