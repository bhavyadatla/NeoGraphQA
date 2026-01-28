import type { Express, Request, Response } from "express";
import { openai } from "./client";

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt, size = "1024x1024" } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: size as "1024x1024" | "1792x1024" | "1024x1792",
        response_format: "b64_json"
      });

      const imageData = response.data?.[0];
      
      if (!imageData) {
        return res.status(500).json({ error: "No image data returned" });
      }
      
      res.json({
        b64_json: imageData.b64_json,
        revised_prompt: imageData.revised_prompt
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });
}
