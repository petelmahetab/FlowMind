import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  const sop = await prisma.sop.findFirst({
    where: { id, userId: user.id },
    include: {
      steps: {
        include: { checklistItems: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!sop) return NextResponse.json({ error: "SOP not found" }, { status: 404 });

  const runs = await prisma.executionRun.findMany({
    where: { sopId: id },
    include: {
      stepLogs: {
        include: { checklistItem: true },
        orderBy: { toggledAt: "asc" },
      },
    },
  });

  if (runs.length === 0) {
    return NextResponse.json({ error: "No execution data yet. Run this SOP at least once to get analysis." }, { status: 400 });
  }

  // ─── Calculate per-item stats ───
  const totalRuns = runs.length;

  const itemStats: Record<string, {
    text: string;
    stepTitle: string;
    stepOrder: number;
    tickedCount: number;
    avgMinutesFromStart: number | null;
    timestamps: number[];
  }> = {};

  for (const step of sop.steps) {
    for (const item of step.checklistItems) {
      itemStats[item.id] = {
        text: item.text,
        stepTitle: step.title,
        stepOrder: step.order,
        tickedCount: 0,
        avgMinutesFromStart: null,
        timestamps: [],
      };
    }
  }

  for (const run of runs) {
    const runStart = new Date(run.startedAt).getTime();
    const seenItems = new Set<string>();

    for (const log of run.stepLogs) {
      if (log.done && !seenItems.has(log.checklistItemId)) {
        seenItems.add(log.checklistItemId);
        const stat = itemStats[log.checklistItemId];
        if (stat) {
          stat.tickedCount += 1;
          const minutesFromStart = (new Date(log.toggledAt).getTime() - runStart) / 60000;
          stat.timestamps.push(minutesFromStart);
        }
      }
    }
  }

  // Calculate averages
  for (const stat of Object.values(itemStats)) {
    if (stat.timestamps.length > 0) {
      stat.avgMinutesFromStart = Math.round(
        stat.timestamps.reduce((a, b) => a + b, 0) / stat.timestamps.length
      );
    }
  }

  // Build summary for AI
  const stepSummaries = sop.steps.map((step) => {
    const items = step.checklistItems.map((item) => {
      const s = itemStats[item.id];
      const completionRate = s ? Math.round((s.tickedCount / totalRuns) * 100) : 0;
      const avgTime = s?.avgMinutesFromStart ?? null;
      return `  - "${item.text}": completed ${completionRate}% of runs${avgTime !== null ? `, avg ${avgTime} min from start` : ""}`;
    });
    return `Step ${step.order + 1}: "${step.title}"\n${items.join("\n")}`;
  }).join("\n\n");

  const prompt = `You are analyzing execution data for an SOP (Standard Operating Procedure) called "${sop.title}".

Total executions analyzed: ${totalRuns}

Here is the completion data per checklist item:

${stepSummaries}

Based on this data, provide a concise analysis in JSON format with this exact structure:
{
  "overallHealth": "good" | "needs_attention" | "critical",
  "healthScore": <number 0-100>,
  "bottlenecks": [
    {
      "stepTitle": "<step name>",
      "item": "<checklist item>",
      "completionRate": <number>,
      "issue": "<brief description of the problem>",
      "suggestion": "<specific actionable improvement>"
    }
  ],
  "strengths": ["<what is working well>"],
  "topRecommendation": "<single most important thing to fix>"
}

Only return JSON, no other text. Focus on items with low completion rates or unusually high time-to-complete.`;

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1000,
    temperature: 0.3,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let analysis;
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    analysis = JSON.parse(clean);
  } catch {
    analysis = { error: "Could not parse AI response", raw };
  }

  return NextResponse.json({
    totalRuns,
    analysis,
    itemStats: Object.values(itemStats).map((s) => ({
      stepTitle: s.stepTitle,
      text: s.text,
      completionRate: Math.round((s.tickedCount / totalRuns) * 100),
      avgMinutesFromStart: s.avgMinutesFromStart,
    })),
  });
}