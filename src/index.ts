import express from "express";
import dotenv from "dotenv";
import { z } from "zod";

import { openai } from "@ai-sdk/openai";
import { streamObject } from 'ai';

dotenv.config();

const app = express();
app.use(express.json());

// Define zod request schema
const RequestSchema = z.object({
  topic: z.string(),
  audience: z.string(),
  tone: z.enum(["formal", "casual", "humorous"]),
  length: z.enum(["short", "medium", "long"]),
});

type GenerateContentRequest = z.infer<typeof RequestSchema>;

// Define zodresponse schema
const responseSchema = z.object({
  title: z.string(),
  content: z.string(),
});

// Function to generate content
async function generateContent(params: GenerateContentRequest) {
  const { topic, audience, tone, length } =
  RequestSchema.parse(params);

  const systemPrompt = `
  Du är en expert på att skriva artiklar.
   `;

  // Create prompt
  const prompt = `
  Du ska skriva en artikel om ${topic}.
  Målgrupp: ${audience}
  ton: ${tone}
  längd: ${length}
  `;

  // Use streamObject instead of generateObject
  const { partialObjectStream } = await streamObject({
    model: openai("gpt-4o"),
    prompt: prompt,
    system: systemPrompt,
    schema: responseSchema,
  });

  // Collect the streamed object
  let result = {};
  for await (const partialObject of partialObjectStream) {
    result = { ...result, ...partialObject };
  }

  return result as z.infer<typeof responseSchema>;
}

app.post("/generate-content", async (req, res) => {
  try {
    // Use schema to parse the request body
    const params = RequestSchema.parse(req.body);

    // Call the new function with the parsed parameters
    const result = await generateContent(params);

    console.log("vårt resultat", result);

    res.json(result);
  } catch (error) {
    console.error("Ett fel har inträffat:", error);
    res.status(500).json({ error: "Ett internt serverfel inträffade" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server körs på port ${PORT}`);
});
