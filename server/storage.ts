import { 
  documents, kgNodes, kgEdges,
  imageAnalyses,
  type Document, type InsertDocument, 
  type KgNode, type InsertKgNode,
  type KgEdge, type InsertKgEdge,
  type ImageAnalysis, type InsertImageAnalysis
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Documents
  createDocument(doc: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  listDocuments(userId: string): Promise<Document[]>;
  updateDocumentStatus(id: number, status: string): Promise<void>;
  updateDocumentSummary(id: number, summary: string): Promise<void>;
  deleteDocument(id: number): Promise<void>;

  // KG
  createKgNode(node: InsertKgNode): Promise<KgNode>;
  createKgEdge(edge: InsertKgEdge): Promise<KgEdge>;
  getKgByDocId(docId: number): Promise<{ nodes: KgNode[], edges: KgEdge[] }>;

  // Image Analysis
  createImageAnalysis(analysis: InsertImageAnalysis): Promise<ImageAnalysis>;
  listImageAnalyses(userId: number): Promise<ImageAnalysis[]>;
}

export class DatabaseStorage implements IStorage {
  // Documents
  async createDocument(doc: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(doc).returning();
    return newDoc;
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async listDocuments(userId: string): Promise<Document[]> {
    return db.select().from(documents).where(eq(documents.userId, userId));
  }

  async updateDocumentStatus(id: number, status: string): Promise<void> {
    await db.update(documents)
      .set({ processingStatus: status })
      .where(eq(documents.id, id));
  }

  async updateDocumentSummary(id: number, summary: string): Promise<void> {
    await db.update(documents)
      .set({ summary, processingStatus: "completed" })
      .where(eq(documents.id, id));
  }

  async deleteDocument(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  // KG
  async createKgNode(node: InsertKgNode): Promise<KgNode> {
    const [newNode] = await db.insert(kgNodes).values(node).returning();
    return newNode;
  }

  async createKgEdge(edge: InsertKgEdge): Promise<KgEdge> {
    const [newEdge] = await db.insert(kgEdges).values(edge).returning();
    return newEdge;
  }

  async getKgByDocId(docId: number): Promise<{ nodes: KgNode[], edges: KgEdge[] }> {
    const nodes = await db.select().from(kgNodes).where(eq(kgNodes.docId, docId));
    const edges = await db.select().from(kgEdges).where(eq(kgEdges.docId, docId));
    return { nodes, edges };
  }

  // Image Analysis
  async createImageAnalysis(analysis: InsertImageAnalysis): Promise<ImageAnalysis> {
    const [newAnalysis] = await db.insert(imageAnalyses).values(analysis).returning();
    return newAnalysis;
  }

  async listImageAnalyses(userId: number): Promise<ImageAnalysis[]> {
    return db.select().from(imageAnalyses)
      .where(eq(imageAnalyses.userId, userId))
      .orderBy(desc(imageAnalyses.createdAt));
  }
}

export const storage = new DatabaseStorage();
