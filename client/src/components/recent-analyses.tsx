import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Download, Trash2, X, ArrowRight, FileText } from "lucide-react";
import { Analysis } from "@shared/schema";

interface RecentAnalysesProps {
  analyses: Analysis[];
  loading: boolean;
  onSelectAnalysis: (id: string) => void;
}

export default function RecentAnalyses({ 
  analyses, 
  loading, 
  onSelectAnalysis 
}: RecentAnalysesProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success/10 text-success">Completed</Badge>;
      case "processing":
        return <Badge className="bg-warning/10 text-warning">Processing</Badge>;
      case "pending":
        return <Badge className="bg-muted/10 text-muted-foreground">Pending</Badge>;
      case "failed":
        return <Badge className="bg-destructive/10 text-destructive">Failed</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const handleDownload = (analysisId: string, format: string = "json") => {
    // Trigger download
    const link = document.createElement("a");
    link.href = `/api/analyses/${analysisId}/export/${format}`;
    link.download = `analysis_${analysisId}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-6 w-20" />
          </div>
          
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Recent Analyses</h2>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-primary hover:text-primary/80"
            data-testid="button-view-all-analyses"
          >
            View All <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
        
        {analyses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText size={48} className="mx-auto mb-4 text-muted-foreground" />
            <p>No analyses yet. Start by uploading a text file above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">File Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Words</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analyses.slice(0, 10).map((analysis, index) => (
                  <tr 
                    key={analysis.id} 
                    className="hover:bg-muted/30"
                    data-testid={`row-analysis-${index}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="text-muted-foreground" size={16} />
                        <span className="font-medium">{analysis.fileName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(analysis.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {analysis.totalWords.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(analysis.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80 p-1"
                          onClick={() => onSelectAnalysis(analysis.id)}
                          title="View Analysis"
                          data-testid={`button-view-${index}`}
                        >
                          <Eye size={16} />
                        </Button>
                        
                        {analysis.status === "completed" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground p-1"
                            onClick={() => handleDownload(analysis.id)}
                            title="Download"
                            data-testid={`button-download-${index}`}
                          >
                            <Download size={16} />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground p-1"
                            disabled
                          >
                            <Download size={16} />
                          </Button>
                        )}
                        
                        {analysis.status === "processing" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/80 p-1"
                            title="Cancel"
                            data-testid={`button-cancel-${index}`}
                          >
                            <X size={16} />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive/80 p-1"
                            title="Delete"
                            data-testid={`button-delete-${index}`}
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
