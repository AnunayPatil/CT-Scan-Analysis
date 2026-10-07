import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { reportService } from "@/services/api";
import { FileText, Download, Eye, Plus } from "lucide-react";
import { format } from "date-fns";
import type { DiagnosticReport } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function ReportsListPage() {
  const { toast } = useToast();
  const { data: reportsData, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => reportService.getReports(),
  });

  const reports = reportsData?.data || [];
  const scanPath = (report: DiagnosticReport) => `/doctor/report/${report.scan?.id || report.scanId}`;

  const getStatusBadge = (status: DiagnosticReport["status"]) => {
    const variants: Record<DiagnosticReport["status"], { variant: "default" | "secondary" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Draft" },
      finalized: { variant: "default", label: "Finalized" },
      amended: { variant: "outline", label: "Amended" },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const handleDownload = async (report: DiagnosticReport) => {
    try {
      const blob = await reportService.downloadReportPdf(report.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${report.reportNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Could not download report",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Diagnostic Reports</h1>
          <p className="text-muted-foreground">View and manage all diagnostic reports</p>
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Diagnostic Reports</h1>
          <p className="text-muted-foreground">View and manage all diagnostic reports</p>
        </div>
        <Button asChild>
          <Link to="/doctor/upload">
            <Plus className="mr-2 h-4 w-4" /> New Scan
          </Link>
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Generate reports from analyzed scans to see them here.
            </p>
            <Button asChild>
              <Link to="/doctor/history">View Scan History</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              All Reports ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Report #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Impression</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.reportNumber}
                    </TableCell>
                    <TableCell>
                      {report.patient?.firstName} {report.patient?.lastName}
                    </TableCell>
                    <TableCell>
                      {format(new Date(report.generatedAt), "PPp")}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {report.impression}
                    </TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link to={scanPath(report)}>
                            <Eye className="h-3 w-3" />
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownload(report)}>
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
