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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // 1. Register Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Register Image Generation Routes
  registerImageRoutes(app);

  // 3. Document Routes
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
                { role: "system", content: "Summarize the following text concisely." },
                { role: "user", content: content.substring(0, 10000) }
              ]
            });
            const summary = summaryResponse.choices[0].message.content || "No summary generated.";
            await storage.updateDocumentSummary(doc.id, summary);

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
    const doc = await storage.getDocument(Number(req.params.id));
    if (!doc) return res.status(404).json({ message: "Not found" });
    if (doc.userId !== (req.user as any).id) return res.status(401).json({ message: "Unauthorized" });
    res.json(doc);
  });

  // Serve image files
  app.get("/api/images/:id", isAuthenticated, async (req: any, res) => {
    const doc = await storage.getDocument(Number(req.params.id));
    if (!doc || doc.fileType !== "image" || !doc.fileUrl) {
      return res.status(404).json({ message: "Image not found" });
    }
    if (doc.userId !== (req.user as any).id) return res.status(401).json({ message: "Unauthorized" });
    
    res.sendFile(path.resolve(doc.fileUrl));
  });

  // Download any document file
  app.get("/api/documents/:id/download", isAuthenticated, async (req: any, res) => {
    const doc = await storage.getDocument(Number(req.params.id));
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }
    if (doc.userId !== req.user.claims.sub) {
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
    const docId = Number(req.params.id);
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
    const docId = Number(req.params.id);
    const kg = await storage.getKgByDocId(docId);
    res.json(kg);
  });

  app.delete(api.documents.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const docId = Number(req.params.id);
      const doc = await storage.getDocument(docId);
      
      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (doc.userId !== req.user.claims.sub) {
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
  app.post(api.chat.query.path, isAuthenticated, async (req: any, res) => {
    try {
      const { message, mode, documentId, imageBase64, chatHistory } = req.body;

      // Use chat history from frontend (session storage)
      const historyMessages = (chatHistory || []).map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));

      // Retrieval Logic
      let context = "";
      let reasoning = "Direct answer generation with conversation context.";

      // Handle Image Analysis mode
      if (mode === "image" && imageBase64) {
        reasoning = "Analyzing uploaded image using vision model.";
        
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "You are an expert image analyst. Describe images in detail. Remember previous conversation context." },
            ...historyMessages.slice(0, -1), // Include history except current message
            { 
              role: "user", 
              content: [
                { type: "text", text: message },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
              ]
            }
          ]
        });

        const answer = aiResponse.choices[0].message.content || "I couldn't analyze the image.";

        return res.json({
          response: answer,
          confidence: 0.92,
          reasoning,
          source: "Image Analysis"
        });
      }

      if (documentId) {
        const doc = await storage.getDocument(documentId);
        if (doc) {
          if (mode === "kg") {
            const kg = await storage.getKgByDocId(documentId);
            context = `Knowledge Graph Nodes: ${kg.nodes.map(n => n.label).join(", ")}. Edges: ${kg.edges.map(e => `${e.sourceId}->${e.relation}->${e.targetId}`).join(", ")}.`;
            reasoning = "Using Knowledge Graph entities with conversation context.";
          } else {
            context = `Document Content: ${doc.content.substring(0, 5000)}...`;
            reasoning = "Using Document text content with conversation context.";
          }
        }
      }

      // Build system message with context
      const systemMessage = context 
        ? `You are NeoGraphQA, a helpful AI assistant. You have access to the following context: ${context}. Remember and reference previous messages in this conversation.`
        : `You are NeoGraphQA, a helpful AI assistant. Remember and reference previous messages in this conversation to provide coherent, contextual responses.`;

      // Generate Answer with full conversation history
      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemMessage },
          ...historyMessages
        ]
      });

      const answer = aiResponse.choices[0].message.content || "I couldn't generate an answer.";

      res.json({
        response: answer,
        confidence: 0.95,
        reasoning,
        source: documentId ? "Document " + documentId : "General Knowledge"
      });

    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ message: "Internal Error" });
    }
  });

  return httpServer;
}
