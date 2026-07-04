import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export type Branch = {
  condition: string;
  nextStepOrder: number;
  label: string;
};

export type GeneratedSop = {
  title: string;
  description: string;
  steps: {
    title: string;
    description: string;
    owner?: string;
    durationMins?: number;
    branches: Branch[] | null;
    checklistItems: { text: string }[];
  }[];
};

export async function generateSopFromText(
  rawText: string
): Promise<GeneratedSop> {
  const prompt = `
You are an expert at turning messy process descriptions into structured SOPs.

Respond with ONLY valid JSON. No markdown, no backticks, no explanation.

JSON format:
{
  "title": "max 8 word title",
  "description": "one sentence description",
  "steps": [
    {
      "title": "action-oriented step title",
      "description": "what to do and why",
      "owner": "Developer",
      "durationMins": 10,
      "branches": null,
      "checklistItems": [
        { "text": "specific sub-task" },
        { "text": "another sub-task" }
      ]
    }
  ]
}

BRANCHING RULES — critical:
- If a step contains words like "if", "agar", "else", "warna", "or", "depends on", "based on", "check if" — it is a branching step
- For branching steps, set branches to an array:
  "branches": [
    { "condition": "if database issue", "nextStepOrder": 4, "label": "Database path" },
    { "condition": "if network issue", "nextStepOrder": 6, "label": "Network path" },
    { "condition": "else", "nextStepOrder": 8, "label": "Escalate path" }
  ]
- nextStepOrder is the 1-based position of the step to jump to
- Non-branching steps MUST have "branches": null
- 3 to 8 steps total, 2 to 4 checklist items per step
- Use imperative verbs
- ONLY return JSON

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