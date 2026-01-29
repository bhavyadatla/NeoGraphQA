import type { Express, Request, Response } from "express";
import { openai } from "./client";
import { db } from "../../db";
import { generatedImages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt, size = "1024x1024" } = req.body;
      const userId = (req as any).user?.claims?.sub;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        n: 1,
        size: size as "1024x1024" | "512x512" | "256x256"
      });

      const imageData = response.data?.[0];
      
      if (!imageData || !imageData.b64_json) {
        return res.status(500).json({ error: "No image data returned" });
      }

      // Store the generated image in the database
      const [savedImage] = await db.insert(generatedImages).values({
        userId: userId || "anonymous",
        prompt,
        imageData: imageData.b64_json,
        size,
        revisedPrompt: (imageData as any).revised_prompt || null
      }).returning();
      
      res.json({
        id: savedImage.id,
        b64_json: imageData.b64_json,
        revised_prompt: (imageData as any).revised_prompt
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // Get all generated images for gallery
  app.get("/api/generated-images", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      const images = await db.select().from(generatedImages)
        .where(userId ? eq(generatedImages.userId, userId) : undefined)
        .orderBy(desc(generatedImages.createdAt));
      res.json(images);
    } catch (error) {
      console.error("Error fetching generated images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  // Get a single generated image by ID
  app.get("/api/generated-images/:id", async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
      const [image] = await db.select().from(generatedImages).where(eq(generatedImages.id, id));
      if (!image) {
        return res.status(404).json({ error: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      console.error("Error fetching image:", error);
      res.status(500).json({ error: "Failed to fetch image" });
    }
  });

  // Delete a generated image
  app.delete("/api/generated-images/:id", async (req: Request, res: Response) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam);
      await db.delete(generatedImages).where(eq(generatedImages.id, id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });
}
