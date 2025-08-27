import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const analyses = pgTable("analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  fileName: text("file_name").notNull(),
  originalText: text("original_text").notNull(),
  processedText: text("processed_text"),
  totalWords: integer("total_words").notNull().default(0),
  uniqueWords: integer("unique_words").notNull().default(0),
  networkNodes: integer("network_nodes").notNull().default(0),
  communities: integer("communities").notNull().default(0),
  wordFrequencies: jsonb("word_frequencies").notNull().$type<Array<{word: string, frequency: number, relative: number, connections: number}>>(),
  networkData: jsonb("network_data").$type<{nodes: Array<{id: string, label: string, size: number, color: string, x?: number, y?: number}>, edges: Array<{id: string, source: string, target: string, weight: number}>}>(),
  communityData: jsonb("communities_data").$type<Array<{id: number, nodes: string[], color: string}>>(),
  options: jsonb("options").notNull().$type<{
    removeStopwords: boolean,
    lemmatization: boolean,
    removeAccents: boolean,
    communityDetection: boolean,
    minFrequency: number,
    maxWords: number
  }>(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  fileName: true,
  originalText: true,
  options: true,
}).extend({
  options: z.object({
    removeStopwords: z.boolean().default(true),
    lemmatization: z.boolean().default(true),
    removeAccents: z.boolean().default(false),
    communityDetection: z.boolean().default(true),
    minFrequency: z.number().min(1).default(2),
    maxWords: z.number().min(10).default(100)
  })
});

export const analysisOptionsSchema = z.object({
  removeStopwords: z.boolean().default(true),
  lemmatization: z.boolean().default(true),
  removeAccents: z.boolean().default(false),
  communityDetection: z.boolean().default(true),
  minFrequency: z.number().min(1).default(2),
  maxWords: z.number().min(10).default(100)
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type AnalysisOptions = z.infer<typeof analysisOptionsSchema>;
