import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import fs from "fs";
import path from "path";
// Import integration helpers
import { registerAuthRoutes, setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerImageRoutes } from "./replit_integrations/image";
import { chatStorage } from "./replit_integrations/chat/storage"; // Reuse DB storage
import { openai } from "./replit_integrations/image/client"; // Reuse OpenAI client from image module (same key)

// PDF parsing using CommonJS require (pdf-parse doesn't support ESM)
import { createRequire } from "module";

async function parsePDF(dataBuffer: Buffer): Promise<string> {
  const require = createRequire(process.cwd() + '/');
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(dataBuffer);
  return data.text;
}

// Configure Multer
const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

import { registerChatRoutes } from "./replit_integrations/chat";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // 1. Register Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Register Image Generation Routes
  registerImageRoutes(app);

  // 3. Register Chat Routes
  registerChatRoutes(app);

  // 4. Document Routes
  app.post(api.documents.upload.path, isAuthenticated, upload.single("file"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      
      const fileType = req.file.mimetype.startsWith("image/") ? "image" : (req.file.mimetype === "application/pdf" ? "pdf" : "txt");
      let content = "";

      // Extract text
      if (fileType === "pdf") {
        try {
          const dataBuffer = fs.readFileSync(req.file.path);
          content = await parsePDF(dataBuffer);
        } catch (pdfErr) {
          console.error("PDF Parsing Error:", pdfErr);
          // Fallback or rethrow
          throw new Error("Failed to parse PDF content");
        }
      } else if (fileType === "image") {
        content = "Image file uploaded";
      } else {
        content = fs.readFileSync(req.file.path, "utf-8");
      }

      // Cleanup temp file - wait, we should move it to a permanent location if it's an image we want to display
      // For now, let's just extract text for documents and keep images in uploads/
      // In a real app, we'd use object storage.

      const userId = (req.user as any).id; // From custom auth
      const doc = await storage.createDocument({
        userId,
        title: req.file.originalname,
        content,
        fileUrl: req.file.path, 
        fileType,
        processingStatus: fileType === "image" ? "completed" : "processing"
      });

      // Auto-process non-image documents
      if (fileType !== "image" && content) {
        (async () => {
          try {
            // 1. Generate Summary
            const summaryResponse = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                { role: "system", content: "You are an expert summarizer. Generate both an abstractive summary (natural language) and an extractive summary (key bullet points). Format your response as JSON: { abstractive: string, extractive: string }." },
                { role: "user", content: content.substring(0, 10000) }
              ],
              response_format: { type: "json_object" }
            });
            const summaries = JSON.parse(summaryResponse.choices[0].message.content || "{}");
            await storage.updateDocumentSummary(doc.id, summaries.abstractive || "No summary generated.");
            if (summaries.extractive) {
              await db.update(documents).set({ extractiveSummary: summaries.extractive }).where(eq(documents.id, doc.id));
            }

            // 2. Build Knowledge Graph
            const kgResponse = await openai.chat.completions.create({
              model: "gpt-4o",
              messages: [
                { role: "system", content: "Extract a comprehensive knowledge graph from the text. Identify key entities (nodes) and their relationships (edges). Return JSON: { nodes: [{label, type}], edges: [{source, target, relation}] }." },
                { role: "user", content: content.substring(0, 8000) }
              ],
              response_format: { type: "json_object" }
            });
            
            const kgData = JSON.parse(kgResponse.choices[0].message.content || "{}");
            if (kgData.nodes && kgData.edges) {
              const nodeMap = new Map<string, number>();
              for (const n of kgData.nodes) {
                const node = await storage.createKgNode({
                  docId: doc.id,
                  label: n.label,
                  type: n.type || "Entity"
                });
                nodeMap.set(n.label, node.id);
              }
              for (const e of kgData.edges) {
                const sourceId = nodeMap.get(e.source);
                const targetId = nodeMap.get(e.target);
                if (sourceId && targetId) {
                  await storage.createKgEdge({
                    docId: doc.id,
                    sourceId,
                    targetId,
                    relation: e.relation
                  });
                }
              }
            }
            await storage.updateDocumentStatus(doc.id, "completed");
          } catch (e) {
            console.error("Auto-processing error:", e);
            await storage.updateDocumentStatus(doc.id, "failed");
          }
        })();
      }

      res.status(201).json(doc);
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.get(api.documents.list.path, isAuthenticated, async (req: any, res) => {
    const docs = await storage.listDocuments((req.user as any).id);
    res.json(docs);
  });

  app.get(api.documents.get.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid document ID" });
    const doc = await storage.getDocument(id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.userId !== (req.user as any).id) return res.status(401).json({ message: "Unauthorized" });
    res.json(doc);
  });

  // Serve image files
  app.get("/api/images/:id", isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid image ID" });
    const doc = await storage.getDocument(id);
    if (!doc || doc.fileType !== "image" || !doc.fileUrl) {
      return res.status(404).json({ message: "Image not found" });
    }
    if (doc.userId !== (req.user as any).id) return res.status(401).json({ message: "Unauthorized" });
    
    res.sendFile(path.resolve(doc.fileUrl));
  });

  // Download any document file
  app.get("/api/documents/:id/download", isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid document ID" });
    const doc = await storage.getDocument(id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    if (doc.userId !== (req.user as any).id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!doc.fileUrl || !fs.existsSync(doc.fileUrl)) {
      return res.status(404).json({ message: "File not available" });
    }
    
    // Set appropriate content type
    let contentType = "application/octet-stream";
    if (doc.fileType === "pdf") contentType = "application/pdf";
    else if (doc.fileType === "image") contentType = "image/png";
    else if (doc.fileType === "txt") contentType = "text/plain";
    
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${doc.title}"`);
    res.sendFile(path.resolve(doc.fileUrl));
  });

  app.post(api.documents.process.path, isAuthenticated, async (req: any, res) => {
    const docId = parseInt(req.params.id as string);
    if (isNaN(docId)) return res.status(400).json({ message: "Invalid document ID" });
    const doc = await storage.getDocument(docId);
    
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.userId !== (req.user as any).id) return res.status(401).json({ message: "Unauthorized" });

    // Start background processing
    (async () => {
      try {
        await storage.updateDocumentStatus(docId, "processing");

        // 1. Generate Summary
        const summaryResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "Summarize the following text concisely." },
            { role: "user", content: doc.content.substring(0, 10000) } // Limit context
          ]
        });
        const summary = summaryResponse.choices[0].message.content || "No summary generated.";
        await storage.updateDocumentSummary(docId, summary);

        // 2. Build Knowledge Graph (Triplets)
        const kgResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "Extract a comprehensive knowledge graph from the text. Identify key entities (nodes) and their relationships (edges). Focus on accuracy and structural depth. Return JSON: { nodes: [{label, type}], edges: [{source, target, relation}] }." },
            { role: "user", content: doc.content.substring(0, 8000) }
          ],
          response_format: { type: "json_object" }
        });
        
        const kgData = JSON.parse(kgResponse.choices[0].message.content || "{}");
        if (kgData.nodes && kgData.edges) {
          // Naive insert - ideally check duplicates
          // Map label to ID for edges
          const nodeMap = new Map<string, number>();

          for (const n of kgData.nodes) {
            const node = await storage.createKgNode({
              docId,
              label: n.label,
              type: n.type || "Entity"
            });
            nodeMap.set(n.label, node.id);
          }

          for (const e of kgData.edges) {
            const sourceId = nodeMap.get(e.source);
            const targetId = nodeMap.get(e.target);
            if (sourceId && targetId) {
              await storage.createKgEdge({
                docId,
                sourceId,
                targetId,
                relation: e.relation
              });
            }
          }
        }

        await storage.updateDocumentStatus(docId, "completed");
      } catch (e) {
        console.error("Processing error:", e);
        await storage.updateDocumentStatus(docId, "failed");
      }
    })();

    res.json({ message: "Processing started" });
  });

  app.get(api.kg.get.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const kg = await storage.getKgByDocId(id);
    res.json(kg);
  });

  // Ask Question from Knowledge Graph
  app.post("/api/kg/ask", isAuthenticated, async (req: any, res) => {
    try {
      const { documentId, question } = req.body;
      if (!documentId || !question) {
        return res.status(400).json({ message: "Document ID and question are required" });
      }

      const kg = await storage.getKgByDocId(documentId);
      if (!kg || !kg.nodes.length) {
        return res.status(400).json({ message: "No knowledge graph found for this document" });
      }

      // Format the KG for the prompt
      const nodesDescription = kg.nodes.map(n => `${n.label} (${n.type})`).join(", ");
      const edgesDescription = kg.edges.map(e => {
        const source = kg.nodes.find(n => n.id === e.sourceId);
        const target = kg.nodes.find(n => n.id === e.targetId);
        return source && target ? `${source.label} --[${e.relation}]--> ${target.label}` : null;
      }).filter(Boolean).join("; ");

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `You are a knowledge graph analyst. Answer the user's question based on the following knowledge graph.
            
NODES: ${nodesDescription}

RELATIONSHIPS: ${edgesDescription}

Provide a clear answer and explain the reasoning path through the graph that led to your answer.
Return your response as JSON: { "answer": "your detailed answer", "reasoningPath": ["step 1", "step 2", ...] }`
          },
          { role: "user", content: question }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content || '{"answer": "Unable to process", "reasoningPath": []}');
      res.json(result);
    } catch (error) {
      console.error("KG Ask error:", error);
      res.status(500).json({ message: "Failed to process question" });
    }
  });

  // Generate KG Insights
  app.post("/api/kg/insights", isAuthenticated, async (req: any, res) => {
    try {
      const { documentId } = req.body;
      if (!documentId) {
        return res.status(400).json({ message: "Document ID is required" });
      }

      const kg = await storage.getKgByDocId(documentId);
      if (!kg || !kg.nodes.length) {
        return res.status(400).json({ message: "No knowledge graph found for this document" });
      }

      // Format the KG for the prompt
      const nodesDescription = kg.nodes.map(n => `${n.label} (${n.type})`).join(", ");
      const edgesDescription = kg.edges.map(e => {
        const source = kg.nodes.find(n => n.id === e.sourceId);
        const target = kg.nodes.find(n => n.id === e.targetId);
        return source && target ? `${source.label} --[${e.relation}]--> ${target.label}` : null;
      }).filter(Boolean).join("; ");

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: `Analyze the following knowledge graph and provide insights about its structure, important concepts, and key relationships.

NODES (${kg.nodes.length}): ${nodesDescription}

RELATIONSHIPS (${kg.edges.length}): ${edgesDescription}

Return your response as JSON: { "summary": "A 2-3 sentence summary of the knowledge graph", "keyFindings": ["finding 1", "finding 2", "finding 3", ...] }`
          },
          { role: "user", content: "Analyze this knowledge graph and provide insights." }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800
      });

      const result = JSON.parse(response.choices[0].message.content || '{"summary": "Unable to analyze", "keyFindings": []}');
      res.json(result);
    } catch (error) {
      console.error("KG Insights error:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  // Image Analysis History
  app.get("/api/image-analyses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const analyses = await storage.listImageAnalyses(userId);
      res.json(analyses);
    } catch (error) {
      console.error("List image analyses error:", error);
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.post("/api/image-analyses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const analysis = await storage.createImageAnalysis({
        ...req.body,
        userId,
      });
      res.status(201).json(analysis);
    } catch (error) {
      console.error("Save image analysis error:", error);
      res.status(500).json({ message: "Internal Error" });
    }
  });

  app.delete(api.documents.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const docId = parseInt(req.params.id as string);
      if (isNaN(docId)) return res.status(400).json({ message: "Invalid ID" });
      const doc = await storage.getDocument(docId);
      
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (doc.userId !== (req.user as any).id) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Delete associated file if exists
      if (doc.fileUrl && fs.existsSync(doc.fileUrl)) {
        fs.unlinkSync(doc.fileUrl);
      }
      
      await storage.deleteDocument(docId);
      res.status(204).send();
    } catch (err) {
      console.error("Delete error:", err);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // 4. Smart Chat Route - Uses session-based chat history from frontend
  // (Note: registerChatRoutes in server/replit_integrations/chat/routes.ts handles persistent chat)
  // We can keep this for compatibility or move logic there.

  return httpServer;
}
