import express from "express";
import dotenv from "dotenv";
import { z } from "zod";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/src/helpers/zod.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(express.json());

const requestSchema = z.object({
  topic: z.string(),
  audience: z.string(),
  tone: z.enum(["formal", "casual", "humorous"]),
  length: z.enum(["short", "medium", "long"]),
});

const responseSchema = z.object({
  title: z.string(),
  content: z.string(),
});

app.post("/generate-content", async (req, res) => {
  try {
    const { topic, audience, tone, length } = requestSchema.parse(req.body);

    const prompt = `
    Du ska skriva en artikel om ${topic}.
    Målgrupp: ${audience}
    ton: ${tone}
    längd: ${length}
    `;

    const completion = await openai.beta.chat.completions.parse({
      model: "gpt-4o-2024-08-06",
      messages: [
        {
          role: "system",
          content: "Du är en copywriter som skriver för forbes magazine",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: zodResponseFormat(responseSchema, "generatedContent"),
    });

    const generatedContent = completion.choices[0].message.parsed;
    console.log("vårt resultat", generatedContent);

    res.json(generatedContent);
  } catch {
    console.log("Ett fel har inträffat.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server körs på port ${PORT}`);
});
