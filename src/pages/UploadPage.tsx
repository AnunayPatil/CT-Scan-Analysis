import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { predictionService, reportService, patientService } from "@/services/api";
import { Upload, X, FileImage, Loader2, AlertCircle, User, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PredictionResponse, Patient } from "@/types";
import { useQuery } from "@tanstack/react-query";

const LOW_CONFIDENCE_THRESHOLD = 0.5;

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientList, setShowPatientList] = useState(false);
  const { toast } = useToast();

  const { data: patientsData } = useQuery({
    queryKey: ["patients-upload", patientSearch],
    queryFn: () => patientService.getPatients(patientSearch || undefined),
  });

  const patients = patientsData?.data?.data || [];

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    setFiles(droppedFiles.slice(0, 1));
    setPrediction(null);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files).filter(f => f.type.startsWith("image/")).slice(0, 1));
      setPrediction(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPrediction(null);
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    if (!selectedPatient) {
      toast({
        title: "Patient required",
        description: "Please select a patient before uploading a scan.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setAnalyzing(true);
      setPrediction(null);
      setProgress(45);
      const result = await predictionService.predict(files[0], selectedPatient.id);
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
          } catch (reportError) {
            toast({
              title: "Prediction complete",
              description: "Result is shown below, but the report could not be generated.",
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Prediction complete",
          description: `${result.data.predicted_class} (${Math.round(result.data.confidence * 100)}% confidence)`,
        });
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Could not analyze the image",
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
        <p className="text-muted-foreground">Upload one brain CT slice for AI-powered classification</p>
      </div>

      {/* Patient Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Select Patient
          </CardTitle>
          <CardDescription>Search and select the patient this scan belongs to.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedPatient ? (
            <div className="flex items-center justify-between rounded-lg border border-primary/40 bg-primary/5 p-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                  {selectedPatient.firstName.charAt(0)}{selectedPatient.lastName.charAt(0)}
                </div>
                <div>
                  <div className="font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</div>
                  <div className="text-xs text-muted-foreground">ID: {selectedPatient.patientId}</div>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setSelectedPatient(null)}>Change</Button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search patient by name or ID..."
                  value={patientSearch}
                  className="pl-9"
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setShowPatientList(true);
                  }}
                  onFocus={() => setShowPatientList(true)}
                />
              </div>
              {showPatientList && patients.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border bg-popover shadow-lg max-h-52 overflow-auto">
                  {patients.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => {
                        setSelectedPatient(p);
                        setShowPatientList(false);
                        setPatientSearch("");
                      }}
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{p.firstName} {p.lastName}</div>
                        <div className="text-xs text-muted-foreground">{p.patientId} · {p.gender}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Image</CardTitle>
          <CardDescription>Supports a single PNG or JPG image. DICOM support can be added later.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-8 transition-colors hover:border-primary/50"
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-center font-medium">Drag & drop a CT image here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
            <input id="file-input" type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected image</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1 truncate text-sm">{file.name}</div>
                    <Button variant="ghost" size="icon" onClick={() => removeFile(i)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {analyzing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing with the PyTorch model...</span>
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
                <p className="text-2xl font-semibold">{prediction.predicted_class}</p>
                <p className="text-sm font-medium">
                  {Math.round(prediction.confidence * 100)}% confidence
                </p>
              </div>
              {prediction.confidence < LOW_CONFIDENCE_THRESHOLD && (
                <div className="mt-3 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>
                    Low-confidence result. Check that the model weights and preprocessing match the original training code.
                  </p>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Processed in {prediction.processing_time_ms} ms
              </p>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>This AI tool is for clinical decision support only. All results must be verified by a qualified radiologist.</p>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={files.length === 0 || analyzing || !selectedPatient}
            className="w-full"
            size="lg"
          >
            {analyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : "Analyze Scan"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
