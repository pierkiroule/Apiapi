import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAnalysis } from "@/lib/analysis-api";
import NetworkVisualization from "./network-visualization";
import { Type, List, CircleDot, Users, ArrowRight, Download, Maximize } from "lucide-react";

interface AnalysisResultsProps {
  analysisId: string;
}

export default function AnalysisResults({ analysisId }: AnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ["/api/analyses", analysisId],
    queryFn: () => getAnalysis(analysisId),
    refetchInterval: (data) => {
      // Refetch while analysis is still processing
      if (data?.status === "processing" || data?.status === "pending") {
        return 2000; // Poll every 2 seconds
      }
      return false; // Stop polling when completed
    },
  });

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Failed to load analysis results</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "network", label: "Network Graph" },
    { id: "frequencies", label: "Word Frequencies" },
    { id: "communities", label: "Communities" },
  ];

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

  return (
    <Card>
      {/* Tab Navigation */}
      <div className="border-b border-border px-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              }`}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="lg:col-span-2">
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>
        ) : !analysis ? (
          <div className="text-center text-muted-foreground">
            <p>Analysis not found</p>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Analysis Overview</h3>
                    <div className="flex items-center space-x-2">
                      <p className="text-muted-foreground">Status:</p>
                      {getStatusBadge(analysis.status)}
                    </div>
                  </div>
                </div>

                {analysis.status === "completed" ? (
                  <div className="grid lg:grid-cols-3 gap-6">
                    {/* Statistics Cards */}
                    <div className="lg:col-span-1">
                      <h4 className="text-lg font-semibold mb-4">Analysis Statistics</h4>
                      <div className="space-y-4">
                        <div className="bg-muted rounded-lg p-4" data-testid="stat-total-words">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total Words</span>
                            <Type className="text-muted-foreground" size={20} />
                          </div>
                          <div className="text-2xl font-bold text-foreground">{analysis.totalWords}</div>
                        </div>
                        
                        <div className="bg-muted rounded-lg p-4" data-testid="stat-unique-words">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Unique Words</span>
                            <List className="text-muted-foreground" size={20} />
                          </div>
                          <div className="text-2xl font-bold text-foreground">{analysis.uniqueWords}</div>
                        </div>
                        
                        <div className="bg-muted rounded-lg p-4" data-testid="stat-network-nodes">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Network Nodes</span>
                            <CircleDot className="text-muted-foreground" size={20} />
                          </div>
                          <div className="text-2xl font-bold text-foreground">{analysis.networkNodes}</div>
                        </div>
                        
                        <div className="bg-muted rounded-lg p-4" data-testid="stat-communities">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Communities</span>
                            <Users className="text-muted-foreground" size={20} />
                          </div>
                          <div className="text-2xl font-bold text-foreground">{analysis.communities}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Top Words Table */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold">Most Frequent Words</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab("frequencies")}
                          data-testid="button-view-all-words"
                        >
                          View All <ArrowRight size={16} className="ml-1" />
                        </Button>
                      </div>
                      
                      <div className="overflow-hidden rounded-lg border">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Word</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Frequency</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Relative</th>
                              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Connections</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {analysis.wordFrequencies.slice(0, 5).map((word, index) => (
                              <tr key={word.word} className="hover:bg-muted/30" data-testid={`row-word-${index}`}>
                                <td className="px-4 py-3 font-medium text-foreground">{word.word}</td>
                                <td className="px-4 py-3 text-muted-foreground">{word.frequency}</td>
                                <td className="px-4 py-3 text-muted-foreground">{word.relative.toFixed(2)}%</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span className="text-sm text-muted-foreground">{word.connections}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="loading-skeleton h-8 w-32 rounded mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                      {analysis.status === "processing" 
                        ? "Analysis is being processed..." 
                        : analysis.status === "pending"
                        ? "Analysis is queued for processing..."
                        : "Analysis failed to complete"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Network Tab */}
            {activeTab === "network" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Interactive Network Visualization</h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" data-testid="button-fit-network">
                      <Maximize size={16} className="mr-1" />
                      Fit
                    </Button>
                    <Button variant="ghost" size="sm" data-testid="button-export-svg">
                      <Download size={16} className="mr-1" />
                      Export SVG
                    </Button>
                  </div>
                </div>
                
                {analysis.status === "completed" && analysis.networkData ? (
                  <NetworkVisualization networkData={analysis.networkData} />
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg min-h-96 flex items-center justify-center">
                    <div className="text-center">
                      <CircleDot className="mx-auto mb-4 text-muted-foreground" size={48} />
                      <h4 className="text-lg font-medium text-foreground mb-2">Network Visualization</h4>
                      <p className="text-muted-foreground">
                        {analysis.status === "completed" 
                          ? "No network data available" 
                          : "Waiting for analysis to complete..."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Frequencies Tab */}
            {activeTab === "frequencies" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Word Frequencies</h3>
                
                {analysis.status === "completed" ? (
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Rank</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Word</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Frequency</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Relative %</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Connections</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {analysis.wordFrequencies.map((word, index) => (
                          <tr key={word.word} className="hover:bg-muted/30" data-testid={`row-frequency-${index}`}>
                            <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{word.word}</td>
                            <td className="px-4 py-3 text-muted-foreground">{word.frequency}</td>
                            <td className="px-4 py-3 text-muted-foreground">{word.relative.toFixed(2)}%</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-1">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 60%)` }}
                                ></div>
                                <span className="text-sm text-muted-foreground">{word.connections}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Word frequency data will be available after analysis completes.</p>
                  </div>
                )}
              </div>
            )}

            {/* Communities Tab */}
            {activeTab === "communities" && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Detected Communities</h3>
                
                {analysis.status === "completed" && analysis.communities ? (
                  <div className="grid gap-4">
                    {analysis.communities.map((community, index) => (
                      <Card key={community.id} className="p-4" data-testid={`community-${index}`}>
                        <div className="flex items-center space-x-3 mb-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: community.color }}
                          ></div>
                          <h4 className="font-medium">Community {community.id + 1}</h4>
                          <Badge variant="outline">{community.nodes.length} words</Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {community.nodes.map((node, nodeIndex) => (
                            <Badge 
                              key={node} 
                              variant="secondary" 
                              className="text-xs"
                              data-testid={`community-${index}-word-${nodeIndex}`}
                            >
                              {node}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>
                      {analysis.status === "completed"
                        ? "No community data available"
                        : "Community detection results will be available after analysis completes."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
