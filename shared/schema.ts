import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import Auth and Chat schemas from blueprints
import * as auth from "./models/auth";
import * as chat from "./models/chat";

// Re-export them so they are available to the app
export * from "./models/auth";
export * from "./models/chat";

// === DOCUMENTS ===
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Links to auth.users.id
  title: text("title").notNull(),
  content: text("content").notNull(), // Extracted text
  fileUrl: text("file_url"), // Path to stored file
  fileType: text("file_type").notNull(), // pdf, txt, csv, image
  createdAt: timestamp("created_at").defaultNow(),
  summary: text("summary"), // Abstractive summary
  processingStatus: text("processing_status").default("pending"), // pending, processing, completed, failed
});

// === KNOWLEDGE GRAPH ===
export const kgNodes = pgTable("kg_nodes", {
  id: serial("id").primaryKey(),
  docId: integer("doc_id").references(() => documents.id, { onDelete: "cascade" }),
  label: text("label").notNull(), // Entity name
  type: text("type").notNull(), // Entity type (Person, Org, etc.)
  color: text("color").default("#3b82f6"),
});

export const kgEdges = pgTable("kg_edges", {
  id: serial("id").primaryKey(),
  docId: integer("doc_id").references(() => documents.id, { onDelete: "cascade" }),
  sourceId: integer("source_id").references(() => kgNodes.id, { onDelete: "cascade" }),
  targetId: integer("target_id").references(() => kgNodes.id, { onDelete: "cascade" }),
  relation: text("relation").notNull(), // Relationship label
});

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

// === TYPES ===
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type KgNode = typeof kgNodes.$inferSelect;
export type KgEdge = typeof kgEdges.$inferSelect;
export type InsertKgNode = z.infer<typeof insertKgNodeSchema>;
export type InsertKgEdge = z.infer<typeof insertKgEdgeSchema>;

// Specialized types
export type GraphData = {
  nodes: KgNode[];
  edges: KgEdge[];
};
