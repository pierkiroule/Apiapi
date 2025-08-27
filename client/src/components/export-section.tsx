import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, FileCode, Share } from "lucide-react";

interface ExportSectionProps {
  analysisId: string;
}

export default function ExportSection({ analysisId }: ExportSectionProps) {
  const { toast } = useToast();

  const handleExport = async (format: string) => {
    try {
      const response = await fetch(`/api/analyses/${analysisId}/export/${format}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get filename from headers or generate one
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `analysis_${format}_${Date.now()}.${format}`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: `File downloaded as ${filename}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: "destructive",
      });
    }
  };

  const exports = [
    {
      id: "csv",
      icon: FileSpreadsheet,
      title: "CSV Export",
      description: "Word frequencies & metrics",
      color: "text-success",
      bgColor: "bg-success",
      format: "csv",
    },
    {
      id: "json",
      icon: FileCode,
      title: "JSON Export",
      description: "Complete analysis data",
      color: "text-primary",
      bgColor: "bg-primary",
      format: "json",
    },
    {
      id: "gexf",
      icon: Share,
      title: "GEXF Export",
      description: "For Gephi visualization",
      color: "text-secondary",
      bgColor: "bg-secondary",
      format: "gexf",
    },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Export & Download</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          {exports.map((exportOption) => (
            <div 
              key={exportOption.id}
              className="bg-muted rounded-lg p-4 card-hover cursor-pointer transition-all hover:shadow-md hover:-translate-y-1"
              data-testid={`export-card-${exportOption.id}`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <exportOption.icon className={`text-2xl ${exportOption.color}`} size={32} />
                <div>
                  <h3 className="font-medium">{exportOption.title}</h3>
                  <p className="text-sm text-muted-foreground">{exportOption.description}</p>
                </div>
              </div>
              <Button 
                className={`w-full ${exportOption.bgColor} hover:${exportOption.bgColor}/90 text-white transition-colors text-sm font-medium`}
                onClick={() => handleExport(exportOption.format)}
                data-testid={`button-download-${exportOption.id}`}
              >
                Download {exportOption.format.toUpperCase()}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
