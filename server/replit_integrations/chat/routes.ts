import type { Express, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export function registerChatRoutes(app: Express): void {
  // Send message and get AI response (streaming)
  app.post("/api/chat/query", async (req: Request, res: Response) => {
    try {
      const { message, mode, documentId, imageBase64 } = req.body;

      // Handle Image Analysis mode
      if (mode === "image" && imageBase64) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // Try jpeg first, then png if that fails or just stick to one for consistency
        const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

        const stream = await openai.chat.completions.create({
          model: "gpt-4o",
          stream: true,
          messages: [
            { role: "system", content: "You are an expert image analyst. Describe images in detail. Return ONLY the description. If confidence can be estimated, include it naturally in the text." },
            { 
              role: "user", 
              content: [
                { type: "text", text: (message as string) || "Describe this image" },
                { type: "image_url", image_url: { url: imageUrl } }
              ]
            }
          ]
        });

        for await (const chunk of stream) {
          const delta = (chunk.choices[0]?.delta as any)?.content || "";
          if (delta) {
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
          }
        }
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        return res.end();
      }

      // Generic QA fallback if needed (simplified)
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: message }],
      });
      return res.json({ response: completion.choices[0].message.content });

    } catch (error) {
      console.error("Chat query error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to process query" });
      } else {
        res.write(`data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`);
        res.end();
      }
    }
  });

  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid conversation ID" });
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      return res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      return res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const userId = (req.user as any)?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });
      
      const conversation = await chatStorage.createConversation(userId, title || "New Chat");
      return res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      return res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Update conversation title
  app.patch("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid conversation ID" });
      const { title } = req.body;
      const conversation = await chatStorage.updateConversation(id, title);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ error: "Failed to update conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      if (isNaN(id)) return res.status(400).json({ error: "Invalid conversation ID" });
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id as string);
      if (isNaN(conversationId)) return res.status(400).json({ error: "Invalid conversation ID" });
      const { content, attachments } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content, attachments || []);

      // Auto-rename conversation if it's the first message
      const messagesCount = await chatStorage.getMessagesByConversation(conversationId);
      if (messagesCount.length === 1) {
        const titleResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "Generate a short, descriptive 3-5 word title for a chat conversation based on the user's first message. Return only the title text." },
            { role: "user", content: content }
          ],
        });
        const newTitle = titleResponse.choices[0]?.message?.content?.trim() || "New Chat";
        await chatStorage.updateConversation(conversationId, newTitle);
      }

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      const stream = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: chatMessages,
        stream: true,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const delta = (chunk.choices[0]?.delta as any)?.content || "";
        if (delta) {
          fullResponse += delta;
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

