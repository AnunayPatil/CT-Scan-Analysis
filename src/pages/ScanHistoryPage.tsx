import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { scanService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Eye, FileText, Brain, Calendar, Upload, RefreshCw } from "lucide-react";
import type { ScanStatus, PredictionResult } from "@/types";

export default function ScanHistoryPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScanStatus | "all">("all");
  const [resultFilter, setResultFilter] = useState<PredictionResult | "all">("all");

  const { data: scansResponse, isLoading, refetch } = useQuery({
    queryKey: ["scans", { search, status: statusFilter, prediction: resultFilter }],
    queryFn: () => scanService.getScans({
      search: search || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      prediction: resultFilter !== "all" ? resultFilter : undefined,
    }),
  });

  const scans = scansResponse?.data?.data || [];

  const getStatusBadge = (status: ScanStatus) => {
    const variants: Record<ScanStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "outline", label: "Pending" },
      uploading: { variant: "secondary", label: "Uploading" },
      analyzing: { variant: "secondary", label: "Analyzing" },
      completed: { variant: "default", label: "Completed" },
      failed: { variant: "destructive", label: "Failed" },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getResultBadge = (prediction?: PredictionResult) => {
    if (!prediction) return <span className="text-muted-foreground">-</span>;
    const abnormal = prediction === "stroke" || prediction === "bleeding" || prediction === "ischemia";
    return abnormal
      ? <Badge variant="destructive" className="capitalize">{prediction}</Badge>
      : <Badge className="bg-green-500 hover:bg-green-600">Normal</Badge>;
  };

  const formatConfidence = (confidence?: number) => {
    if (confidence == null) return "-";
    return confidence <= 1 ? `${(confidence * 100).toFixed(1)}%` : `${confidence.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Scan History</h1>
          <p className="text-muted-foreground">MongoDB scan records created after upload and analysis</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => navigate("/doctor/upload")}>
            <Upload className="mr-2 h-4 w-4" />
            New Scan
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by patient name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ScanStatus | "all")}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="analyzing">Analyzing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={resultFilter} onValueChange={(v) => setResultFilter(v as PredictionResult | "all")}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="bleeding">Bleeding</SelectItem>
                <SelectItem value="ischemia">Ischemia</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scan Records</CardTitle>
          <CardDescription>{scans.length} scans found</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : scans.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No scans found</h3>
              <p className="text-muted-foreground mt-1">Upload a scan to create MongoDB scan and result records.</p>
              <Button className="mt-4" onClick={() => navigate("/doctor/upload")}>
                <Upload className="mr-2 h-4 w-4" />
                Upload New Scan
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Scan Date</TableHead>
                  <TableHead>Slices</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{scan.patient?.firstName} {scan.patient?.lastName}</p>
                        <p className="text-sm text-muted-foreground">{scan.patient?.patientId}</p>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(scan.scanDate).toLocaleDateString()}</TableCell>
                    <TableCell>{scan.sliceCount}</TableCell>
                    <TableCell>{getStatusBadge(scan.status)}</TableCell>
                    <TableCell>{scan.status === "completed" ? getResultBadge(scan.result?.prediction) : "-"}</TableCell>
                    <TableCell>
                      {scan.status === "completed" ? (
                        <span className="font-medium">{formatConfidence(scan.result?.confidence)}</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/doctor/results/${scan.id}`)}
                          disabled={scan.status !== "completed"}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/doctor/report/${scan.id}`)}
                          disabled={scan.status !== "completed"}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

