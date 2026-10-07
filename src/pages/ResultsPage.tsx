import { Link, useLocation, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { scanService } from "@/services/api";
import type { AnalysisResult } from "@/types";
import { AlertTriangle, CheckCircle, Brain, FileText, Eye } from "lucide-react";

const isAbnormal = (prediction?: string) =>
  prediction === "stroke" || prediction === "bleeding" || prediction === "ischemia";

const formatConfidence = (confidence?: number) => {
  if (confidence == null) return "-";
  return confidence <= 1 ? `${(confidence * 100).toFixed(1)}%` : `${confidence.toFixed(1)}%`;
};

export default function ResultsPage() {
  const { scanId } = useParams();
  const location = useLocation();
  const stateResult = location.state?.result as AnalysisResult | undefined;

  const resultQuery = useQuery({
    queryKey: ["scan-result", scanId],
    queryFn: () => scanService.getAnalysisResult(scanId!),
    enabled: !!scanId && !stateResult,
    retry: false,
  });

  if (resultQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const result = stateResult || resultQuery.data?.data;

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">No saved result found for this scan.</p>
        <Button asChild className="mt-4"><Link to="/doctor/upload">Upload Scan</Link></Button>
      </div>
    );
  }

  const abnormal = isAbnormal(result.prediction);
  const resultLabel = abnormal ? result.prediction.toUpperCase() : "NORMAL";
  const targetScanId = result.scanId || scanId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analysis Results</h1>
        <p className="text-muted-foreground">Saved MongoDB analysis result for scan #{targetScanId?.slice(0, 8)}</p>
      </div>

      <Card className={abnormal ? "border-destructive/50 bg-destructive/5" : "border-success/50 bg-success/5"}>
        <CardContent className="flex items-center gap-6 p-6">
          <div className={`flex h-20 w-20 items-center justify-center rounded-full ${abnormal ? "bg-destructive/20" : "bg-success/20"}`}>
            {abnormal ? <AlertTriangle className="h-10 w-10 text-destructive" /> : <CheckCircle className="h-10 w-10 text-success" />}
          </div>
          <div className="flex-1">
            <Badge variant={abnormal ? "destructive" : "default"} className="mb-2">
              {resultLabel}
            </Badge>
            <h2 className="text-2xl font-bold">{abnormal ? "Abnormality Detected" : "No Abnormality Detected"}</h2>
            <p className="text-muted-foreground">Confidence: {formatConfidence(result.confidence)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Processing Time</p>
            <p className="text-xl font-bold">{((result.processingTime || 0) / 1000).toFixed(2)}s</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Model Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div><p className="text-sm text-muted-foreground">Model</p><p className="font-medium">{result.modelName}</p></div>
          <div><p className="text-sm text-muted-foreground">Version</p><p className="font-medium">{result.modelVersion}</p></div>
          <div><p className="text-sm text-muted-foreground">Architecture</p><p className="font-medium">EfficientNet-B0 + BiLSTM</p></div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button asChild><Link to={`/doctor/report/${targetScanId}`}><FileText className="mr-2 h-4 w-4" /> View Report</Link></Button>
      </div>

      <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
        <strong>Medical Disclaimer:</strong> This AI analysis is intended for clinical decision support only. Results must be verified by qualified medical professionals before any clinical decisions are made.
      </div>
    </div>
  );
}

