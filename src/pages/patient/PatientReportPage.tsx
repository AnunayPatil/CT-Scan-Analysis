import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { reportService } from "@/services/api";
import { Download, FileText, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PatientReportPage() {
  const { scanId } = useParams();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["patient-report", scanId],
    queryFn: () => reportService.getReportByScanId(scanId!),
    enabled: !!scanId,
    retry: false,
  });

  const report = data?.data;
  const result = report?.result;
  const confidence =
    result?.confidence == null
      ? null
      : result.confidence <= 1
        ? `${(result.confidence * 100).toFixed(1)}%`
        : `${result.confidence.toFixed(1)}%`;

  const statusLabel = useMemo(() => {
    if (!report) return "unavailable";
    return report.status;
  }, [report]);

  const handleDownload = async () => {
    if (!report?.id) return;
    try {
      const blob = await reportService.downloadReportPdf(report.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.reportNumber || "report"}-${report.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Could not download PDF",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Report not available yet.</p>
        <Button asChild variant="outline">
          <Link to={`/patient/scans/${scanId}`}>Back to Scan</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to={`/patient/scans/${scanId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Diagnostic Report</h1>
            <p className="text-muted-foreground">Read-only report prepared for clinician review.</p>
          </div>
        </div>
        <Badge className="capitalize" variant={report.status === "finalized" ? "default" : "secondary"}>
          {statusLabel}
        </Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" /> {report.reportNumber}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Generated: {new Date(report.generatedAt).toLocaleString()}</p>
          </div>
          <Button onClick={handleDownload} variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">Result</div>
            <div className="mt-1 text-xl font-bold">
              {result?.prediction || "Pending"}
            </div>
            {confidence && (
              <div className="text-sm text-muted-foreground">Confidence: {confidence}</div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Findings</div>
            <div className="rounded-lg border p-4 text-sm text-muted-foreground whitespace-pre-wrap">
              {report.findings || "Not available yet."}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Impression</div>
            <div className="rounded-lg border p-4 text-sm text-muted-foreground whitespace-pre-wrap">
              {report.impression || "Not available yet."}
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            This report is provided for informational purposes and must be interpreted by your clinician.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

