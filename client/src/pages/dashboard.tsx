import { useState } from "react";
import FileUpload from "@/components/file-upload";
import AnalysisResults from "@/components/analysis-results";
import ExportSection from "@/components/export-section";
import RecentAnalyses from "@/components/recent-analyses";
import { useQuery } from "@tanstack/react-query";
import { getAnalyses } from "@/lib/analysis-api";
import { ChartGantt, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);
  
  const { data: analyses, isLoading } = useQuery({
    queryKey: ["/api/analyses"],
    queryFn: () => getAnalyses(),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm" data-testid="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                <ChartGantt className="text-white" size={16} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">CourtialAPI</h1>
                <p className="text-xs text-muted-foreground">Text Analysis & Lexical Networks</p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-6">
              <a href="#" className="text-foreground hover:text-primary transition-colors font-medium">Dashboard</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API</a>
              <Button className="font-medium" data-testid="button-new-analysis">
                <Plus className="mr-2" size={16} />
                New Analysis
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* File Upload Section */}
        <section className="mb-8">
          <FileUpload onAnalysisComplete={setSelectedAnalysis} />
        </section>

        {/* Analysis Results Section */}
        {selectedAnalysis && (
          <section className="mb-8">
            <AnalysisResults analysisId={selectedAnalysis} />
          </section>
        )}

        {/* Export Section */}
        {selectedAnalysis && (
          <section className="mb-8">
            <ExportSection analysisId={selectedAnalysis} />
          </section>
        )}

        {/* Recent Analyses Section */}
        <section>
          <RecentAnalyses 
            analyses={analyses || []} 
            loading={isLoading}
            onSelectAnalysis={setSelectedAnalysis}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-6 h-6 gradient-bg rounded flex items-center justify-center">
                  <ChartGantt className="text-white" size={12} />
                </div>
                <span className="font-semibold">CourtialAPI</span>
              </div>
              <p className="text-muted-foreground text-sm">
                Advanced text analysis and lexical network generation for research and data analysis.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">API Reference</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Examples</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <div className="flex space-x-3">
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <i className="fab fa-github text-lg"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <i className="fab fa-twitter text-lg"></i>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground">
                  <i className="fas fa-envelope text-lg"></i>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-4 text-center text-sm text-muted-foreground">
            © 2025 CourtialAPI. MIT License.
          </div>
        </div>
      </footer>
    </div>
  );
}
