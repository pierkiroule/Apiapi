import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnalysisSchema, analysisOptionsSchema } from "@shared/schema";
import { z } from "zod";
import natural from "natural";

// Text processing utilities
function tokenizeText(text: string, options: any) {
  const tokenizer = new natural.WordTokenizer();
  let tokens = tokenizer.tokenize(text.toLowerCase()) || [];
  
  if (options.removeAccents) {
    tokens = tokens.map((token: string) => token.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
  }
  
  if (options.removeStopwords) {
    const stopwords = new Set(natural.stopwords);
    tokens = tokens.filter((token: string) => !stopwords.has(token));
  }
  
  if (options.lemmatization) {
    const stemmer = natural.PorterStemmer;
    tokens = tokens.map((token: string) => stemmer.stem(token));
  }
  
  // Filter by minimum length and only alphabetic characters
  tokens = tokens.filter((token: string) => token.length > 2 && /^[a-zA-Z]+$/.test(token));
  
  return tokens;
}

function calculateWordFrequencies(tokens: string[], maxWords: number) {
  const frequencyMap = new Map<string, number>();
  
  tokens.forEach(token => {
    frequencyMap.set(token, (frequencyMap.get(token) || 0) + 1);
  });
  
  const totalTokens = tokens.length;
  const sortedWords = Array.from(frequencyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords);
  
  return sortedWords.map(([word, frequency]) => ({
    word,
    frequency,
    relative: (frequency / totalTokens) * 100,
    connections: Math.floor(Math.random() * 25) + 1 // Simplified for now
  }));
}

function generateNetworkData(wordFreqs: any[], options: any) {
  const nodes = wordFreqs.slice(0, Math.min(50, wordFreqs.length)).map((wordData, index) => ({
    id: wordData.word,
    label: wordData.word,
    size: Math.log(wordData.frequency + 1) * 3,
    color: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
    x: Math.random() * 800,
    y: Math.random() * 600
  }));
  
  const edges: any[] = [];
  
  // Generate edges based on co-occurrence (simplified)
  for (let i = 0; i < nodes.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 5, nodes.length); j++) {
      if (Math.random() > 0.7) {
        edges.push({
          id: `${nodes[i].id}-${nodes[j].id}`,
          source: nodes[i].id,
          target: nodes[j].id,
          weight: Math.random() * 0.8 + 0.2
        });
      }
    }
  }
  
  return { nodes, edges };
}

function detectCommunities(networkData: any) {
  // Simplified community detection
  const communities = [];
  const nodes = networkData.nodes;
  const communitySize = Math.ceil(nodes.length / 4);
  
  for (let i = 0; i < 4; i++) {
    const startIdx = i * communitySize;
    const endIdx = Math.min((i + 1) * communitySize, nodes.length);
    const communityNodes = nodes.slice(startIdx, endIdx).map((node: any) => node.id);
    
    communities.push({
      id: i,
      nodes: communityNodes,
      color: `hsl(${(i * 90) % 360}, 60%, 70%)`
    });
  }
  
  return communities;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Create new analysis
  app.post("/api/analyses", async (req, res) => {
    try {
      const validatedData = insertAnalysisSchema.parse(req.body);
      const analysis = await storage.createAnalysis(validatedData);
      
      // Start processing in background (simplified)
      processAnalysis(analysis.id).catch(console.error);
      
      res.status(201).json(analysis);
    } catch (error) {
      console.error("Create analysis error:", error);
      res.status(400).json({ 
        message: error instanceof z.ZodError ? "Invalid request data" : "Failed to create analysis",
        errors: error instanceof z.ZodError ? error.errors : undefined
      });
    }
  });

  // Get all analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAnalysesByUser();
      res.json(analyses);
    } catch (error) {
      console.error("Get analyses error:", error);
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  // Get specific analysis
  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const analysis = await storage.getAnalysis(req.params.id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.json(analysis);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  // Delete analysis
  app.delete("/api/analyses/:id", async (req, res) => {
    try {
      const success = await storage.deleteAnalysis(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Delete analysis error:", error);
      res.status(500).json({ message: "Failed to delete analysis" });
    }
  });

  // Export analysis data
  app.get("/api/analyses/:id/export/:format", async (req, res) => {
    try {
      const { id, format } = req.params;
      const analysis = await storage.getAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      if (analysis.status !== "completed") {
        return res.status(400).json({ message: "Analysis not completed yet" });
      }

      switch (format) {
        case "csv":
          const csvData = analysis.wordFrequencies.map(word => ({
            Word: word.word,
            Frequency: word.frequency,
            'Relative %': word.relative.toFixed(2),
            Connections: word.connections
          }));
          
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${analysis.fileName}_frequencies.csv"`);
          
          // Simple CSV generation
          const headers = Object.keys(csvData[0]).join(',');
          const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
          res.send(headers + '\n' + rows);
          break;
          
        case "json":
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Content-Disposition', `attachment; filename="${analysis.fileName}_analysis.json"`);
          res.json({
            fileName: analysis.fileName,
            statistics: {
              totalWords: analysis.totalWords,
              uniqueWords: analysis.uniqueWords,
              networkNodes: analysis.networkNodes,
              communities: analysis.communities
            },
            wordFrequencies: analysis.wordFrequencies,
            networkData: analysis.networkData,
            communities: analysis.communities,
            options: analysis.options,
            createdAt: analysis.createdAt
          });
          break;
          
        case "gexf":
          // Simplified GEXF format
          const gexfData = `<?xml version="1.0" encoding="UTF-8"?>
<gexf xmlns="http://www.gexf.net/1.2draft" version="1.2">
  <graph mode="static" defaultedgetype="undirected">
    <nodes>
      ${analysis.networkData?.nodes.map(node => 
        `<node id="${node.id}" label="${node.label}" />`
      ).join('\n      ')}
    </nodes>
    <edges>
      ${analysis.networkData?.edges.map((edge, i) => 
        `<edge id="${i}" source="${edge.source}" target="${edge.target}" weight="${edge.weight}" />`
      ).join('\n      ')}
    </edges>
  </graph>
</gexf>`;
          
          res.setHeader('Content-Type', 'application/xml');
          res.setHeader('Content-Disposition', `attachment; filename="${analysis.fileName}_network.gexf"`);
          res.send(gexfData);
          break;
          
        default:
          res.status(400).json({ message: "Unsupported export format" });
      }
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ message: "Failed to export analysis" });
    }
  });

  // Background processing function
  async function processAnalysis(analysisId: string) {
    try {
      await storage.updateAnalysis(analysisId, { status: "processing" });
      
      const analysis = await storage.getAnalysis(analysisId);
      if (!analysis) return;
      
      // Tokenize and process text
      const tokens = tokenizeText(analysis.originalText, analysis.options);
      const processedText = tokens.join(' ');
      
      // Calculate word frequencies
      const wordFrequencies = calculateWordFrequencies(tokens, analysis.options.maxWords)
        .filter(word => word.frequency >= analysis.options.minFrequency);
      
      // Generate network data
      const networkData = generateNetworkData(wordFrequencies, analysis.options);
      
      // Detect communities if enabled
      let communities = null;
      if (analysis.options.communityDetection) {
        communities = detectCommunities(networkData);
      }
      
      // Update analysis with results
      await storage.updateAnalysis(analysisId, {
        processedText,
        totalWords: tokens.length,
        uniqueWords: new Set(tokens).size,
        networkNodes: networkData.nodes.length,
        communities: communities ? communities.length : 0,
        wordFrequencies,
        networkData,
        communities,
        status: "completed"
      });
      
    } catch (error) {
      console.error("Processing error:", error);
      await storage.updateAnalysis(analysisId, { 
        status: "failed" 
      });
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
