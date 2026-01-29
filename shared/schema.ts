import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// Import Auth and Chat schemas from blueprints
import * as auth from "./models/auth";
import * as chat from "./models/chat";

// Re-export them so they are available to the app
export * from "./models/auth";
export * from "./models/chat";

// Note: users and sessions tables are defined in ./models/auth.ts

// === DOCUMENTS ===
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  fileType: text("file_type").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  summary: text("summary"), // Abstractive summary
  extractiveSummary: text("extractive_summary"), // Extractive summary
  processingStatus: text("processing_status").default("pending"), // pending, processing, completed, failed
});

// === KNOWLEDGE GRAPH ===
export const kgNodes = pgTable("kg_nodes", {
  id: serial("id").primaryKey(),
  docId: integer("doc_id").references(() => documents.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  type: text("type").notNull(),
  color: text("color").default("#3b82f6"),
});

export const kgEdges = pgTable("kg_edges", {
  id: serial("id").primaryKey(),
  docId: integer("doc_id").references(() => documents.id, { onDelete: "cascade" }),
  sourceId: integer("source_id").references(() => kgNodes.id, { onDelete: "cascade" }),
  targetId: integer("target_id").references(() => kgNodes.id, { onDelete: "cascade" }),
  relation: text("relation").notNull(),
});

// === CONVERSATIONS ===
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// === MESSAGES ===
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  attachments: jsonb("attachments").default([]),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// === GENERATED IMAGES ===
export const generatedImages = pgTable("generated_images", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  prompt: text("prompt").notNull(),
  imageData: text("image_data").notNull(),
  size: text("size").default("1024x1024"),
  revisedPrompt: text("revised_prompt"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const imageAnalyses = pgTable("image_analyses", {
  id: serial("id").primaryKey(),
  userId: text("user_id"),
  imageUrl: text("image_url").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  confidence: text("confidence"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertImageAnalysisSchema = createInsertSchema(imageAnalyses).omit({ id: true, createdAt: true });
export type InsertImageAnalysis = z.infer<typeof insertImageAnalysisSchema>;
export type ImageAnalysis = typeof imageAnalyses.$inferSelect;

// === RELATIONS ===
export const documentsRelations = relations(documents, ({ many }) => ({
  nodes: many(kgNodes),
  edges: many(kgEdges),
}));

export const kgNodesRelations = relations(kgNodes, ({ one }) => ({
  document: one(documents, {
    fields: [kgNodes.docId],
    references: [documents.id],
  }),
}));

export const kgEdgesRelations = relations(kgEdges, ({ one }) => ({
  document: one(documents, {
    fields: [kgEdges.docId],
    references: [documents.id],
  }),
  source: one(kgNodes, {
    fields: [kgEdges.sourceId],
    references: [kgNodes.id],
    relationName: "source",
  }),
  target: one(kgNodes, {
    fields: [kgEdges.targetId],
    references: [kgNodes.id],
    relationName: "target",
  }),
}));

// === SCHEMAS ===
export const insertDocumentSchema = createInsertSchema(documents).omit({ 
  id: true, 
  createdAt: true,
  summary: true
});

export const insertKgNodeSchema = createInsertSchema(kgNodes).omit({ id: true });
export const insertKgEdgeSchema = createInsertSchema(kgEdges).omit({ id: true });
export const insertGeneratedImageSchema = createInsertSchema(generatedImages).omit({ id: true, createdAt: true });

// === TYPES ===
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type KgNode = typeof kgNodes.$inferSelect;
export type KgEdge = typeof kgEdges.$inferSelect;
export type InsertKgNode = z.infer<typeof insertKgNodeSchema>;
export type InsertKgEdge = z.infer<typeof insertKgEdgeSchema>;
export type GeneratedImage = typeof generatedImages.$inferSelect;
export type InsertGeneratedImage = z.infer<typeof insertGeneratedImageSchema>;
export type GraphData = {
  nodes: KgNode[];
  edges: KgEdge[];
};
