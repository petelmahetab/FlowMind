import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

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
  const prompt = `
You are an expert at turning messy process descriptions into clean, structured Standard Operating Procedures (SOPs).

Respond with ONLY valid JSON. No markdown, no backticks, no explanation.

JSON format:
{
  "title": "short title max 8 words",
  "description": "one sentence describing this SOP",
  "steps": [
    {
      "title": "action-oriented step title",
      "description": "what to do and why",
      "owner": "Developer",
      "durationMins": 10,
      "checklistItems": [
        { "text": "specific sub-task" },
        { "text": "another sub-task" }
      ]
    }
  ]
}

Rules:
- 3 to 8 steps
- 2 to 4 checklist items per step
- Use imperative verbs
- ONLY return JSON, nothing else

User's process:
"""
${rawText}
"""`.trim();

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const text = completion.choices[0]?.message?.content ?? "";
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned) as GeneratedSop;
}