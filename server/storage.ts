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
      communities: null,
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
