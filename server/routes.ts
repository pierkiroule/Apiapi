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

type WordFrequency = {
  word: string;
  frequency: number;
  relative: number;
  connections: number;
};

type NetworkNode = {
  id: string;
  label: string;
  size: number;
  color: string;
  x?: number;
  y?: number;
};

type NetworkEdge = {
  id: string;
  source: string;
  target: string;
  weight: number;
};

function calculateWordFrequencies(tokens: string[], maxWords: number, minFrequency: number): WordFrequency[] {
  const frequencyMap = new Map<string, number>();

  tokens.forEach(token => {
    frequencyMap.set(token, (frequencyMap.get(token) || 0) + 1);
  });

  const totalTokens = tokens.length;
  const sortedWords = Array.from(frequencyMap.entries())
    .filter(([, frequency]) => frequency >= minFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxWords);

  return sortedWords.map(([word, frequency]) => ({
    word,
    frequency,
    relative: (frequency / totalTokens) * 100,
    connections: 0
  }));
}

function buildCoOccurrences(tokens: string[], allowedWords: Set<string>, windowSize = 4) {
  const coOccurrenceCounts = new Map<string, number>();

  for (let i = 0; i < tokens.length; i++) {
    if (!allowedWords.has(tokens[i])) continue;

    for (let j = i + 1; j <= i + windowSize && j < tokens.length; j++) {
      if (!allowedWords.has(tokens[j]) || tokens[i] === tokens[j]) continue;

      const [source, target] = [tokens[i], tokens[j]].sort();
      const key = `${source}|${target}`;
      coOccurrenceCounts.set(key, (coOccurrenceCounts.get(key) || 0) + 1);
    }
  }

  return coOccurrenceCounts;
}

function generateNetworkData(wordFreqs: WordFrequency[], coOccurrences: Map<string, number>, frequencyMap: Map<string, number>) {
  const nodes: NetworkNode[] = wordFreqs.map((wordData, index) => ({
    id: wordData.word,
    label: wordData.word,
    size: Math.max(6, Math.log(wordData.frequency + 1) * 4),
    color: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
    x: Math.cos((index / wordFreqs.length) * 2 * Math.PI) * 200 + 400,
    y: Math.sin((index / wordFreqs.length) * 2 * Math.PI) * 200 + 300
  }));

  const edges: NetworkEdge[] = [];

  coOccurrences.forEach((count, key) => {
    const [source, target] = key.split("|");
    const freqSource = frequencyMap.get(source) || 1;
    const freqTarget = frequencyMap.get(target) || 1;

    // Callon & Courtial association strength (cij / sqrt(ci * cj))
    const associationStrength = count / Math.sqrt(freqSource * freqTarget);

    edges.push({
      id: `${source}-${target}`,
      source,
      target,
      weight: Number(associationStrength.toFixed(3))
    });
  });

  // Keep strongest edges to avoid overplotting
  const limitedEdges = edges
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 200)
    .filter(edge => edge.weight > 0);

  return { nodes, edges: limitedEdges };
}

function detectCommunities(networkData: { nodes: NetworkNode[]; edges: NetworkEdge[] }) {
  const labels = new Map<string, string>();
  const adjacency = new Map<string, Map<string, number>>();

  networkData.nodes.forEach(node => {
    labels.set(node.id, node.id);
    adjacency.set(node.id, new Map());
  });

  networkData.edges.forEach(edge => {
    adjacency.get(edge.source)?.set(edge.target, edge.weight);
    adjacency.get(edge.target)?.set(edge.source, edge.weight);
  });

  const iterations = 8;
  for (let iter = 0; iter < iterations; iter++) {
    networkData.nodes.forEach(node => {
      const neighbors = adjacency.get(node.id);
      if (!neighbors || neighbors.size === 0) return;

      const labelWeights = new Map<string, number>();
      neighbors.forEach((weight, neighbor) => {
        const neighborLabel = labels.get(neighbor) || neighbor;
        labelWeights.set(neighborLabel, (labelWeights.get(neighborLabel) || 0) + weight);
      });

      let bestLabel = labels.get(node.id) || node.id;
      let bestScore = -Infinity;

      labelWeights.forEach((weight, label) => {
        if (weight > bestScore) {
          bestScore = weight;
          bestLabel = label;
        }
      });

      labels.set(node.id, bestLabel);
    });
  }

  const communitiesMap = new Map<string, string[]>();
  labels.forEach((label, nodeId) => {
    const group = communitiesMap.get(label) || [];
    group.push(nodeId);
    communitiesMap.set(label, group);
  });

  let index = 0;
  return Array.from(communitiesMap.entries()).map(([label, nodes]) => ({
    id: index++,
    nodes,
    color: `hsl(${(index * 72) % 360}, 60%, 70%)`
  }));
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
      
      // Calculate word frequencies and keep only words that meet frequency constraints
      const wordFrequencies = calculateWordFrequencies(
        tokens,
        analysis.options.maxWords,
        analysis.options.minFrequency
      );

      // Build co-occurrence matrix with a sliding window to capture associations
      const frequencyMap = new Map(wordFrequencies.map(word => [word.word, word.frequency]));
      const allowedWords = new Set(wordFrequencies.map(word => word.word));
      const coOccurrences = buildCoOccurrences(tokens, allowedWords, 5);

      // Generate network graph using Callon & Courtial association strength
      const networkData = generateNetworkData(wordFrequencies, coOccurrences, frequencyMap);

      // Update connection counts using the constructed network
      const adjacency = new Map<string, Set<string>>();
      networkData.edges.forEach(edge => {
        if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
        if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
        adjacency.get(edge.source)?.add(edge.target);
        adjacency.get(edge.target)?.add(edge.source);
      });

      wordFrequencies.forEach(word => {
        word.connections = adjacency.get(word.word)?.size || 0;
      });

      // Detect communities if enabled
      let communityData = null;
      if (analysis.options.communityDetection && networkData.edges.length > 0) {
        communityData = detectCommunities(networkData);
      }

      // Update analysis with results
      await storage.updateAnalysis(analysisId, {
        processedText,
        totalWords: tokens.length,
        uniqueWords: new Set(tokens).size,
        networkNodes: networkData.nodes.length,
        communities: communityData ? communityData.length : 0,
        wordFrequencies,
        networkData,
        communityData,
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
