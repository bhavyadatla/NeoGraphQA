import type { Express, Request, Response } from "express";
import { openai } from "./client";

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt, size = "1024x1024" } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Improved prompt for better analysis
      const analysisPrompt = `Analyze this image in extreme detail. 
      If it's a document: Extract all text, identify the document type, and list key entities.
      If it's a scene: Describe objects, colors, lighting, and any text present.
      If it's a technical diagram: Explain the components and their relationships.
      User question: ${prompt}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: analysisPrompt },
              {
                type: "image_url",
                image_url: {
                  url: imageData.url,
                },
              },
            ],
          },
        ],
      });

      const aiResponse = response.choices[0]?.message?.content || "No analysis available.";
      res.json({
        url: imageData.url,
        analysis: aiResponse
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });
}

