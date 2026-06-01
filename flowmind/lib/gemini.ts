import {
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ─── Zod-like schema we pass to Gemini for structured JSON output ───
const sopSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    description: { type: SchemaType.STRING },
    steps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          owner: { type: SchemaType.STRING },
          durationMins: { type: SchemaType.NUMBER },
          checklistItems: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                text: { type: SchemaType.STRING },
              },
              required: ["text"],
            },
          },
        },
        required: ["title", "description", "checklistItems"],
      },
    },
  },
  required: ["title", "description", "steps"],
};

export type GeneratedSop = {
  title: string;
  description: string;
  steps: {
    title: string;
    description: string;
    owner?: string;
    durationMins?: number;
    checklistItems: { text: string }[];
  }[];
};

export async function generateSopFromText(
  rawText: string
): Promise<GeneratedSop> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: sopSchema,
    },
  });

  const prompt = `
You are an expert at turning messy process descriptions into clean, structured Standard Operating Procedures (SOPs).

The user has described a process in plain English. Convert it into a structured SOP with:
- A clear title (max 8 words)
- A one-sentence description of what this SOP covers
- 3-8 numbered steps, each with:
  - A short action-oriented title (e.g. "Push code to main branch")
  - A clear description of what to do and why
  - An owner role if inferable (e.g. "Developer", "Team Lead", "DevOps")
  - Estimated duration in minutes if inferable
  - 2-4 checklist items (specific sub-tasks to tick off)

Keep it practical and actionable. Use imperative verbs. No fluff.

User's process description:
"""
${rawText}
"""
`.trim();

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return JSON.parse(text) as GeneratedSop;
}
