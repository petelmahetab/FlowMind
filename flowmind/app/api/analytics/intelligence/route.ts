import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.plan !== "pro") {
    return NextResponse.json(
      {
        error: "AI Process Intelligence is a Pro feature. Upgrade to unlock.",
        code: "UPGRADE_REQUIRED",
      },
      { status: 403 },
    );
  }

  // ─── Fetch all SOPs with full execution data ───
  const sops = await prisma.sop.findMany({
    where: { userId: user.id },
    include: {
      steps: { include: { checklistItems: true }, orderBy: { order: "asc" } },
      executionRuns: {
        include: {
          stepLogs: { include: { checklistItem: { include: { step: true } } } },
        },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  const sopMetrics = [];
  const executorMap: Record<
    string,
    {
      email: string;
      totalRuns: number;
      completedRuns: number;
      totalItemsExpected: number;
      totalItemsCompleted: number;
      skippedSteps: string[];
    }
  > = {};

  for (const sop of sops) {
    const runs = sop.executionRuns;
    if (runs.length === 0) continue;

    const totalRuns = runs.length;
    const completedRuns = runs.filter((r) => r.status === "completed").length;
    const failureRate = Math.round(
      ((totalRuns - completedRuns) / totalRuns) * 100,
    );

    // Completion times
    const completionTimes = runs
      .filter((r) => r.completedAt)
      .map(
        (r) =>
          (new Date(r.completedAt!).getTime() -
            new Date(r.startedAt).getTime()) /
          60000,
      );
    const avgCompletionMins =
      completionTimes.length > 0
        ? Math.round(
            completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length,
          )
        : null;

    // Per-item skip analysis
    const allChecklistItems = sop.steps.flatMap((s) => s.checklistItems);
    const itemSkipRates: {
      text: string;
      stepTitle: string;
      skipRate: number;
    }[] = [];

    for (const item of allChecklistItems) {
      const step = sop.steps.find((s) => s.id === item.stepId);
      let tickedCount = 0;
      for (const run of runs) {
        const ticked = run.stepLogs.some(
          (l) => l.checklistItemId === item.id && l.done,
        );
        if (ticked) tickedCount++;
      }
      const skipRate = Math.round(
        ((totalRuns - tickedCount) / totalRuns) * 100,
      );
      if (skipRate > 30) {
        itemSkipRates.push({
          text: item.text,
          stepTitle: step?.title ?? "Unknown",
          skipRate,
        });
      }
    }

    // Per-executor breakdown
    for (const run of runs) {
      const email = run.executorEmail;
      if (!executorMap[email]) {
        executorMap[email] = {
          email,
          totalRuns: 0,
          completedRuns: 0,
          totalItemsExpected: 0,
          totalItemsCompleted: 0,
          skippedSteps: [],
        };
      }
      executorMap[email].totalRuns++;
      if (run.status === "completed") executorMap[email].completedRuns++;
      executorMap[email].totalItemsExpected += run.totalItems;
      executorMap[email].totalItemsCompleted += run.completedItems;

      // Track what they skip
      for (const item of allChecklistItems) {
        const ticked = run.stepLogs.some(
          (l) => l.checklistItemId === item.id && l.done,
        );
        if (!ticked && run.totalItems > 0) {
          const step = sop.steps.find((s) => s.id === item.stepId);
          executorMap[email].skippedSteps.push(`${sop.title} → ${step?.title}`);
        }
      }
    }

    sopMetrics.push({
      id: sop.id,
      title: sop.title,
      totalRuns,
      completedRuns,
      failureRate,
      avgCompletionMins,
      topSkippedItems: itemSkipRates
        .sort((a, b) => b.skipRate - a.skipRate)
        .slice(0, 3),
    });
  }

  // Sort by failure rate
  sopMetrics.sort((a, b) => b.failureRate - a.failureRate);

  // Executor insights
  const executorInsights = Object.values(executorMap)
    .map((e) => ({
      email: e.email,
      totalRuns: e.totalRuns,
      completionRate:
        e.totalRuns > 0 ? Math.round((e.completedRuns / e.totalRuns) * 100) : 0,
      skipRate:
        e.totalItemsExpected > 0
          ? Math.round(
              ((e.totalItemsExpected - e.totalItemsCompleted) /
                e.totalItemsExpected) *
                100,
            )
          : 0,
      topSkippedProcesses: [...new Set(e.skippedSteps)].slice(0, 3),
    }))
    .sort((a, b) => b.skipRate - a.skipRate);

  // Global stats
  const totalRuns = sops.reduce((sum, s) => sum + s.executionRuns.length, 0);
  const totalCompleted = sops.reduce(
    (sum, s) =>
      sum + s.executionRuns.filter((r) => r.status === "completed").length,
    0,
  );
  const overallCompletionRate =
    totalRuns > 0 ? Math.round((totalCompleted / totalRuns) * 100) : 0;

  // ─── Groq AI Insights ───
  let aiInsights = null;
  if (sopMetrics.length > 0 && totalRuns > 0) {
    const summaryForAI = sopMetrics.slice(0, 5).map((s) => ({
      sop: s.title,
      runs: s.totalRuns,
      failureRate: `${s.failureRate}%`,
      avgTime: s.avgCompletionMins ? `${s.avgCompletionMins} min` : "N/A",
      topSkips: s.topSkippedItems.map(
        (i) => `${i.stepTitle} → ${i.text} (${i.skipRate}% skip rate)`,
      ),
    }));

    const worstExecutor = executorInsights[0];

    const prompt = `You are a process intelligence analyst. Analyze this SOP execution data and provide strategic insights.

Organization has ${sops.length} SOPs with ${totalRuns} total executions.
Overall completion rate: ${overallCompletionRate}%

Top problematic SOPs:
${JSON.stringify(summaryForAI, null, 2)}

${worstExecutor ? `Most problematic executor: ${worstExecutor.email} with ${worstExecutor.skipRate}% skip rate across ${worstExecutor.totalRuns} runs.` : ""}

Respond ONLY with valid JSON in this exact format:
{
  "executiveSummary": "<2-3 sentence summary of overall process health>",
  "criticalAlerts": [
    "<specific actionable alert with numbers>",
    "<specific actionable alert with numbers>"
  ],
  "topRisk": "<single biggest risk to the organization right now>",
  "quickWins": [
    "<specific quick win that can be implemented this week>",
    "<another quick win>"
  ],
  "processHealthScore": <number 0-100>
}`;

    try {
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.2,
      });
      const raw = completion.choices[0]?.message?.content ?? "{}";
      const clean = raw.replace(/```json|```/g, "").trim();
      aiInsights = JSON.parse(clean);
    } catch (e) {
      console.error("AI insights failed:", e);
    }
  }

  return NextResponse.json({
    overview: {
      totalSops: sops.filter((s) => s.executionRuns.length > 0).length,
      totalRuns,
      overallCompletionRate,
      totalExecutors: Object.keys(executorMap).length,
    },
    sopMetrics,
    executorInsights: executorInsights.slice(0, 10),
    aiInsights,
  });
}
