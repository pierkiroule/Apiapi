import { type User, type InsertUser, type Analysis, type InsertAnalysis } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Analysis operations
  getAnalysis(id: string): Promise<Analysis | undefined>;
  getAnalysesByUser(userId?: string): Promise<Analysis[]>;
  createAnalysis(analysis: InsertAnalysis & { userId?: string }): Promise<Analysis>;
  updateAnalysis(id: string, updates: Partial<Analysis>): Promise<Analysis | undefined>;
  deleteAnalysis(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private analyses: Map<string, Analysis>;

  constructor() {
    this.users = new Map();
    this.analyses = new Map();
    this.initializeDemoAnalysis();
  }

  private async initializeDemoAnalysis() {
    const demoText = `Dans le jardin secret des mots
Où chaque syllabe est une graine
Les pensées dansent comme des papillons
Entre les lignes d'une poésie sereine

Ici germent les rêves oubliés
Chaque terme trouve sa racine
Dans le terreau des émotions
Où l'âme cultive sa routine

Les connexions tissent leur toile
Entre les concepts qui s'enlacent
Créant un réseau de sens
Où les idées se transforment et passent

Comme un tamagotchi de l'esprit
Ce jardin numérique grandit
Nourri par nos mots quotidiens
Il éclot en constellations d'infini

Chaque analyse est une saison
Qui révèle de nouveaux liens
Entre les fragments de nos pensées
Transformés en carte du quotidien

Ô cosmogonie des mots vivants
Univers en perpétuel mouvement
Où naissent les plus beaux poèmes
Dans ce laboratoire du sentiment`;

    const demoAnalysis: Analysis = {
      id: "demo-poetry-garden",
      userId: null,
      fileName: "Jardin Poétique de Démonstration",
      originalText: demoText,
      processedText: "jardin secret mots syllabe graine pensées dansent papillons lignes poésie sereine germent rêves oubliés terme trouve racine terreau émotions âme cultive routine connexions tissent toile concepts enlacent créant réseau sens idées transforment passent tamagotchi esprit jardin numérique grandit nourri mots quotidiens éclot constellations infini analyse saison révèle nouveaux liens fragments pensées transformés carte quotidien cosmogonie mots vivants univers perpétuel mouvement naissent beaux poèmes laboratoire sentiment",
      totalWords: 89,
      uniqueWords: 67,
      networkNodes: 25,
      communities: 4,
      wordFrequencies: [
        { word: "jardin", frequency: 3, relative: 3.37, connections: 8 },
        { word: "mots", frequency: 3, relative: 3.37, connections: 12 },
        { word: "pensées", frequency: 2, relative: 2.25, connections: 6 },
        { word: "poésie", frequency: 2, relative: 2.25, connections: 7 },
        { word: "réseau", frequency: 2, relative: 2.25, connections: 9 },
        { word: "quotidien", frequency: 2, relative: 2.25, connections: 5 },
        { word: "esprit", frequency: 1, relative: 1.12, connections: 4 },
        { word: "univers", frequency: 1, relative: 1.12, connections: 6 },
        { word: "connexions", frequency: 1, relative: 1.12, connections: 8 },
        { word: "émotions", frequency: 1, relative: 1.12, connections: 5 },
        { word: "rêves", frequency: 1, relative: 1.12, connections: 4 },
        { word: "âme", frequency: 1, relative: 1.12, connections: 3 },
        { word: "sentiment", frequency: 1, relative: 1.12, connections: 7 },
        { word: "constellations", frequency: 1, relative: 1.12, connections: 6 },
        { word: "cosmogonie", frequency: 1, relative: 1.12, connections: 8 },
        { word: "papillons", frequency: 1, relative: 1.12, connections: 3 },
        { word: "tamagotchi", frequency: 1, relative: 1.12, connections: 5 },
        { word: "graine", frequency: 1, relative: 1.12, connections: 4 },
        { word: "racine", frequency: 1, relative: 1.12, connections: 3 },
        { word: "toile", frequency: 1, relative: 1.12, connections: 4 },
        { word: "liens", frequency: 1, relative: 1.12, connections: 6 },
        { word: "fragments", frequency: 1, relative: 1.12, connections: 5 },
        { word: "laboratoire", frequency: 1, relative: 1.12, connections: 4 },
        { word: "mouvement", frequency: 1, relative: 1.12, connections: 5 },
        { word: "infini", frequency: 1, relative: 1.12, connections: 7 }
      ],
      networkData: {
        nodes: [
          { id: "jardin", label: "jardin", size: 15, color: "hsl(120, 70%, 60%)", x: 400, y: 300 },
          { id: "mots", label: "mots", size: 15, color: "hsl(240, 70%, 60%)", x: 350, y: 250 },
          { id: "pensées", label: "pensées", size: 12, color: "hsl(180, 70%, 60%)", x: 450, y: 250 },
          { id: "poésie", label: "poésie", size: 12, color: "hsl(300, 70%, 60%)", x: 300, y: 300 },
          { id: "réseau", label: "réseau", size: 12, color: "hsl(60, 70%, 60%)", x: 500, y: 300 },
          { id: "esprit", label: "esprit", size: 10, color: "hsl(0, 70%, 60%)", x: 400, y: 200 },
          { id: "univers", label: "univers", size: 10, color: "hsl(270, 70%, 60%)", x: 350, y: 350 },
          { id: "connexions", label: "connexions", size: 10, color: "hsl(30, 70%, 60%)", x: 450, y: 350 },
          { id: "émotions", label: "émotions", size: 10, color: "hsl(210, 70%, 60%)", x: 250, y: 250 },
          { id: "rêves", label: "rêves", size: 10, color: "hsl(150, 70%, 60%)", x: 550, y: 250 },
          { id: "âme", label: "âme", size: 8, color: "hsl(330, 70%, 60%)", x: 300, y: 200 },
          { id: "sentiment", label: "sentiment", size: 8, color: "hsl(90, 70%, 60%)", x: 500, y: 200 },
          { id: "constellations", label: "constellations", size: 8, color: "hsl(200, 70%, 60%)", x: 400, y: 400 },
          { id: "cosmogonie", label: "cosmogonie", size: 8, color: "hsl(45, 70%, 60%)", x: 300, y: 400 },
          { id: "papillons", label: "papillons", size: 8, color: "hsl(315, 70%, 60%)", x: 500, y: 400 },
          { id: "tamagotchi", label: "tamagotchi", size: 8, color: "hsl(135, 70%, 60%)", x: 250, y: 300 },
          { id: "graine", label: "graine", size: 8, color: "hsl(75, 70%, 60%)", x: 550, y: 300 },
          { id: "racine", label: "racine", size: 8, color: "hsl(165, 70%, 60%)", x: 250, y: 350 },
          { id: "toile", label: "toile", size: 8, color: "hsl(225, 70%, 60%)", x: 550, y: 350 },
          { id: "liens", label: "liens", size: 8, color: "hsl(285, 70%, 60%)", x: 350, y: 150 },
          { id: "fragments", label: "fragments", size: 8, color: "hsl(15, 70%, 60%)", x: 450, y: 150 },
          { id: "laboratoire", label: "laboratoire", size: 8, color: "hsl(105, 70%, 60%)", x: 200, y: 300 },
          { id: "mouvement", label: "mouvement", size: 8, color: "hsl(255, 70%, 60%)", x: 600, y: 300 },
          { id: "infini", label: "infini", size: 8, color: "hsl(345, 70%, 60%)", x: 400, y: 100 },
          { id: "quotidien", label: "quotidien", size: 12, color: "hsl(195, 70%, 60%)", x: 400, y: 450 }
        ],
        edges: [
          { id: "jardin-mots", source: "jardin", target: "mots", weight: 0.8 },
          { id: "jardin-pensées", source: "jardin", target: "pensées", weight: 0.7 },
          { id: "mots-poésie", source: "mots", target: "poésie", weight: 0.9 },
          { id: "pensées-esprit", source: "pensées", target: "esprit", weight: 0.6 },
          { id: "réseau-connexions", source: "réseau", target: "connexions", weight: 0.8 },
          { id: "émotions-âme", source: "émotions", target: "âme", weight: 0.7 },
          { id: "rêves-esprit", source: "rêves", target: "esprit", weight: 0.5 },
          { id: "sentiment-âme", source: "sentiment", target: "âme", weight: 0.6 },
          { id: "constellations-univers", source: "constellations", target: "univers", weight: 0.8 },
          { id: "cosmogonie-univers", source: "cosmogonie", target: "univers", weight: 0.9 },
          { id: "papillons-pensées", source: "papillons", target: "pensées", weight: 0.4 },
          { id: "tamagotchi-jardin", source: "tamagotchi", target: "jardin", weight: 0.7 },
          { id: "graine-jardin", source: "graine", target: "jardin", weight: 0.8 },
          { id: "racine-graine", source: "racine", target: "graine", weight: 0.6 },
          { id: "toile-connexions", source: "toile", target: "connexions", weight: 0.7 },
          { id: "liens-réseau", source: "liens", target: "réseau", weight: 0.8 },
          { id: "fragments-pensées", source: "fragments", target: "pensées", weight: 0.5 },
          { id: "laboratoire-sentiment", source: "laboratoire", target: "sentiment", weight: 0.6 },
          { id: "mouvement-univers", source: "mouvement", target: "univers", weight: 0.5 },
          { id: "infini-constellations", source: "infini", target: "constellations", weight: 0.7 },
          { id: "quotidien-mots", source: "quotidien", target: "mots", weight: 0.6 }
        ]
      },
      communityData: [
        { id: 0, nodes: ["jardin", "graine", "racine", "tamagotchi"], color: "hsl(120, 60%, 70%)" },
        { id: 1, nodes: ["mots", "poésie", "pensées", "papillons", "fragments"], color: "hsl(240, 60%, 70%)" },
        { id: 2, nodes: ["réseau", "connexions", "toile", "liens"], color: "hsl(60, 60%, 70%)" },
        { id: 3, nodes: ["univers", "cosmogonie", "constellations", "infini", "mouvement"], color: "hsl(300, 60%, 70%)" }
      ],
      options: {
        removeStopwords: true,
        lemmatization: true,
        removeAccents: false,
        communityDetection: true,
        minFrequency: 1,
        maxWords: 100
      },
      status: "completed",
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.analyses.set(demoAnalysis.id, demoAnalysis);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAnalysis(id: string): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getAnalysesByUser(userId?: string): Promise<Analysis[]> {
    const allAnalyses = Array.from(this.analyses.values());
    if (!userId) return allAnalyses;
    return allAnalyses.filter(analysis => analysis.userId === userId);
  }

  async createAnalysis(analysis: InsertAnalysis & { userId?: string }): Promise<Analysis> {
    const id = randomUUID();
    const now = new Date();
    const newAnalysis: Analysis = {
      id,
      userId: analysis.userId || null,
      fileName: analysis.fileName,
      originalText: analysis.originalText,
      processedText: null,
      totalWords: 0,
      uniqueWords: 0,
      networkNodes: 0,
      communities: 0,
      wordFrequencies: [],
      networkData: null,
      communityData: null,
      options: analysis.options,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    
    this.analyses.set(id, newAnalysis);
    return newAnalysis;
  }

  async updateAnalysis(id: string, updates: Partial<Analysis>): Promise<Analysis | undefined> {
    const existing = this.analyses.get(id);
    if (!existing) return undefined;
    
    const updated: Analysis = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.analyses.set(id, updated);
    return updated;
  }

  async deleteAnalysis(id: string): Promise<boolean> {
    return this.analyses.delete(id);
  }
}

export const storage = new MemStorage();
