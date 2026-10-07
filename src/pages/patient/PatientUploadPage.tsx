import { useCallback, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { predictionService, reportService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, FileImage, Loader2, Upload, X } from "lucide-react";
import type { PredictionResponse } from "@/types";

const LOW_CONFIDENCE_THRESHOLD = 0.5;

export default function PatientUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const { toast } = useToast();

  const setSelectedImage = (selectedFiles: File[]) => {
    setFiles(selectedFiles.filter((file) => file.type.startsWith("image/")).slice(0, 1));
    setPrediction(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setSelectedImage(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImage(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPrediction(null);
  };

  const handleAnalyze = async () => {
    if (!files.length) return;

    try {
      setAnalyzing(true);
      setPrediction(null);
      setProgress(45);
      const result = await predictionService.predict(files[0]);
      setProgress(100);
      setPrediction(result.data);

      if (result.data.predicted_class === "Other") {
        toast({
          title: "Not a brain CT scan",
          description: "The uploaded image was not recognised as a brain CT scan. Please upload a valid CT slice.",
          variant: "destructive",
        });
      } else {
        if (result.data.scan?.id && result.data.result?.id) {
          try {
            const report = await reportService.generateReport(
              result.data.scan.id,
              result.data.result.id,
            );
            toast({
              title: "Report generated",
              description: `${report.data.reportNumber} was created for this scan.`,
            });
          } catch {
            toast({
              title: "Prediction complete",
              description: "Result is shown below, but the report could not be generated.",
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Analysis complete",
          description: `${result.data.predicted_class} (${Math.round(result.data.confidence * 100)}% confidence)`,
        });
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description:
          error instanceof Error ? error.message : "Could not analyze your scan",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload CT Scan</h1>
        <p className="text-muted-foreground">
          Upload one brain CT slice and view the model result here.
        </p>
      </div>

      <Alert>
        <div className="flex items-start gap-2 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">Clinical decision support</p>
            <p className="text-muted-foreground">
              The model result appears on this page. A qualified clinician should
              still review the scan before any medical decision.
            </p>
          </div>
        </div>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Upload image</CardTitle>
          <CardDescription>
            Supports one PNG or JPG CT brain slice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 transition-colors hover:border-primary/50"
            onClick={() =>
              document.getElementById("patient-file-input")?.click()
            }
          >
            <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-center font-medium">Drag & drop a CT image here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
            <input
              id="patient-file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected image</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 truncate text-sm">{file.name}</div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(i)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analyzing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing with the PyTorch model...</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {prediction && prediction.predicted_class === "Other" && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Not a brain CT scan</p>
                <p className="mt-1">
                  The uploaded image was not recognised as a brain CT scan. Please upload a valid axial CT slice of the brain.
                </p>
              </div>
            </div>
          )}

          {prediction && prediction.predicted_class !== "Other" && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Diagnosis</p>
              <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
                <p className="text-2xl font-semibold">
                  {prediction.predicted_class}
                </p>
                <p className="text-sm font-medium">
                  {Math.round(prediction.confidence * 100)}% confidence
                </p>
              </div>
              {prediction.confidence < LOW_CONFIDENCE_THRESHOLD && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Low-confidence result. Upload a clearer CT slice or ask a
                    clinician to review it.
                  </p>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Processed in {prediction.processing_time_ms} ms
              </p>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={!files.length || analyzing}
            onClick={handleAnalyze}
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
              </>
            ) : (
              "Analyze Scan"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
