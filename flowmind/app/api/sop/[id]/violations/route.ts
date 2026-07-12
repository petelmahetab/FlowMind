import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// GET — list all violations for this SOP
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const violations = await prisma.sopViolation.findMany({
    where: { sopId: id },
    orderBy: { detectedAt: "desc" },
  });

  return NextResponse.json(violations);
}

// POST — check for violations in a completed/in-progress run
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const { runId } = await req.json();

  const sop = await prisma.sop.findFirst({
    where: { id, userId: user.id },
    include: {
      steps: {
        include: {
          checklistItems: { where: { isCritical: true } },
        },
      },
    },
  });

  if (!sop) return NextResponse.json({ error: "SOP not found" }, { status: 404 });

  const run = await prisma.executionRun.findUnique({
    where: { id: runId },
    include: { stepLogs: true },
  });

  if (!run) return NextResponse.json({ error: "Run not found" }, { status: 404 });

  // Find which critical items were NOT ticked
  const tickedItemIds = new Set(
    run.stepLogs.filter((l) => l.done).map((l) => l.checklistItemId)
  );

  const violations = [];

  for (const step of sop.steps) {
    for (const item of step.checklistItems) {
      if (!tickedItemIds.has(item.id)) {
        // Critical step skipped — create violation record
        const violation = await prisma.sopViolation.create({
          data: {
            sopId: id,
            runId,
            executorEmail: run.executorEmail,
            skippedStep: `${step.title} — ${item.text}`,
            alertSent: false,
          },
        });

        // Send email alert to SOP owner
        try {
          await resend.emails.send({
            from: "FlowMind Alerts <alerts@flowmind.app>",
            to: user.email,
            subject: `⚠️ Critical Step Skipped — ${sop.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #dc2626;">⚠️ SOP Violation Detected</h2>
                <p><strong>SOP:</strong> ${sop.title}</p>
                <p><strong>Executor:</strong> ${run.executorEmail}</p>
                <p><strong>Skipped Step:</strong> ${step.title} — ${item.text}</p>
                <p><strong>Detected at:</strong> ${new Date().toLocaleString()}</p>
                <hr/>
                <p style="color: #6b7280; font-size: 12px;">
                  This alert was sent because a critical step was skipped during SOP execution.
                  Review the execution in your FlowMind dashboard.
                </p>
              </div>
            `,
          });

          await prisma.sopViolation.update({
            where: { id: violation.id },
            data: { alertSent: true },
          });
        } catch (emailError) {
          console.error("Email send failed:", emailError);
        }

        violations.push(violation);
      }
    }
  }

  return NextResponse.json({ violations, count: violations.length });
}