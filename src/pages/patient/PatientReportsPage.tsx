import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { reportService } from "@/services/api";
import { FileText, Eye, Calendar, AlertCircle } from "lucide-react";

export default function PatientReportsPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["patient-reports"],
        queryFn: () => reportService.getReports(),
    });

    const reports = data?.data ?? [];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">My Reports</h1>
                    <p className="text-muted-foreground">View your diagnostic reports</p>
                </div>
                <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">My Reports</h1>
                    <p className="text-muted-foreground">View your diagnostic reports</p>
                </div>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                        <p className="text-lg font-medium">Failed to load reports</p>
                        <p className="text-sm text-muted-foreground">Please try again later.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (reports.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">My Reports</h1>
                    <p className="text-muted-foreground">View your diagnostic reports</p>
                </div>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">No reports available</p>
                        <p className="text-sm text-muted-foreground">
                            Reports will appear here once your scans have been analyzed.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">My Reports</h1>
                <p className="text-muted-foreground">View your diagnostic reports</p>
            </div>

            <div className="grid gap-4">
                {reports.map((report: any) => {
                    const scanId = report.scan?.id || report.scanId;
                    return (
                    <Card key={report.id}>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    {report.reportNumber || `Report ${report.id}`}
                                </CardTitle>
                                <Badge
                                    variant={report.status === "finalized" ? "default" : "secondary"}
                                    className="capitalize"
                                >
                                    {report.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(report.generatedAt).toLocaleDateString()}
                                    </span>
                                    <span>Scan: {scanId}</span>
                                </div>
                                <Button asChild variant="outline" size="sm">
                                    <Link to={`/patient/reports/${scanId}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Report
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    );
                })}
            </div>
        </div>
    );
}
