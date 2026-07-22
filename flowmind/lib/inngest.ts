import { Inngest } from "inngest";
import { Resend } from "resend";
import { prisma } from "./prisma";
import { deliverWebhook } from "./webhook";
import { getNextRun } from "./cron";

export const inngest = new Inngest({ id: "flowmind" });
const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Existing: welcome email after signup ───
export const sendWelcomeEmail = inngest.createFunction(
  { id: "send-welcome-email" },
  { event: "user/signed-up" },
  async ({ event }) => {
    const { email, name } = event.data;

    await resend.emails.send({
      from: "FlowMind <hello@yourdomain.com>",
      to: email,
      subject: "Welcome to FlowMind — let's document your first process",
      html: `
        <h2>Hey ${name ?? "there"} 👋</h2>
        <p>You're all set on FlowMind. Your free account lets you create <strong>3 SOPs</strong>.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background:#6366f1;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px">
          Go to Dashboard →
        </a>
      `,
    });

    return { sent: true };
  }
);

// ─── Existing: webhook delivery with automatic retry ───
export const deliverWebhookWithRetry = inngest.createFunction(
  {
    id: "deliver-webhook",
    retries: 3,
    rateLimit: { limit: 100, period: "1m" },
  },
  { event: "webhook/deliver" },
  async ({ event, step }) => {
    const { deliveryId, url, secret, eventName, payload } = event.data;

    const result = await step.run("send-webhook", async () => {
      return deliverWebhook(url, secret, eventName, payload);
    });

    await step.run("update-delivery-record", async () => {
      await prisma.webhookDelivery.update({
        where: { id: deliveryId },
        data: {
          success: result.success,
          statusCode: result.statusCode,
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });
    });

    if (!result.success) {
      throw new Error(`Webhook delivery failed: ${result.statusCode}`);
    }

    return result;
  }
);

// ─── Existing: SOP event hone pe registered webhooks trigger karo ───
export async function triggerWebhooks(
  userId: string,
  eventName: string,
  payload: object
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.plan !== "pro") return; // Pro-only safety net

  const webhooks = await prisma.webhook.findMany({
    where: { userId, isActive: true, events: { has: eventName } },
  });

  for (const webhook of webhooks) {
    const delivery = await prisma.webhookDelivery.create({
      data: { webhookId: webhook.id, event: eventName, payload, attempts: 0 },
    });

    await inngest.send({
      name: "webhook/deliver",
      data: {
        webhookId: webhook.id,
        deliveryId: delivery.id,
        url: webhook.url,
        secret: webhook.secret,
        eventName,
        payload,
      },
    });
  }
}

// ─── NEW: cron job — har 15 minute mein due schedules check karo ───
export const checkDueSchedules = inngest.createFunction(
  { id: "check-due-schedules" },
  { cron: "*/15 * * * *" },
  async ({ step }) => {
    const now = new Date();

    const dueSchedules = await step.run("fetch-due-schedules", async () => {
      return prisma.sopSchedule.findMany({
        where: { isActive: true, nextRunAt: { lte: now } },
        include: {
          sop: {
            include: {
              steps: { include: { checklistItems: true } },
              user: { select: { name: true, email: true } },
            },
          },
        },
      });
    });

    for (const schedule of dueSchedules) {
      const sop = schedule.sop;

      await step.run(`process-schedule-${schedule.id}`, async () => {
        // Auto-publish SOP agar private hai (assignees ko link chahiye)
        if (!sop.isPublic) {
          await prisma.sop.update({ where: { id: sop.id }, data: { isPublic: true } });
        }

        const totalItems = sop.steps.reduce(
          (sum, step) => sum + step.checklistItems.length,
          0
        );
        const deadlineAt = new Date(now.getTime() + schedule.deadlineHours * 60 * 60 * 1000);
        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sop/${sop.shareSlug}`;

        // Har assignee ke liye ek naya ExecutionRun banao + email bhejo
        for (const email of schedule.assigneeEmails) {
          await prisma.executionRun.create({
            data: {
              sopId: sop.id,
              scheduleId: schedule.id,
              executorEmail: email,
              status: "in_progress",
              totalItems,
              completedItems: 0,
              deadlineAt,
            },
          });

          await resend.emails
            .send({
              from: "FlowMind <reminders@yourdomain.com>",
              to: email,
              subject: `⏰ Scheduled SOP: ${sop.title}`,
              html: `
                <div style="font-family: sans-serif; max-width: 500px;">
                  <h2>Scheduled SOP Run</h2>
                  <p>It's time to execute: <strong>${sop.title}</strong></p>
                  <p>Assigned by: ${sop.user.name ?? sop.user.email}</p>
                  <p>Complete by: <strong>${deadlineAt.toLocaleString()}</strong></p>
                  <a href="${shareUrl}" style="display:inline-block;margin-top:12px;background:#6366f1;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">
                    Start SOP →
                  </a>
                </div>
              `,
            })
            .catch((err) => console.error("[scheduled-run] email failed:", err));
        }

        // Next run calculate karo aur schedule update karo
        const nextRunAt = getNextRun(schedule.cronExpression, now);
        await prisma.sopSchedule.update({
          where: { id: schedule.id },
          data: { lastRunAt: now, nextRunAt },
        });
      });
    }

    return { processed: dueSchedules.length };
  }
);

// ─── NEW: deadline se 2 ghante pehle reminder ───
export const sendDeadlineReminders = inngest.createFunction(
  { id: "send-deadline-reminders" },
  { cron: "0 * * * *" }, // har ghante
  async () => {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const urgentRuns = await prisma.executionRun.findMany({
      where: {
        status: "in_progress",
        deadlineAt: { gte: now, lte: twoHoursLater },
        remindedAt: null, // sirf ek baar reminder bhejo
      },
      include: { sop: { select: { title: true, shareSlug: true } } },
    });

    for (const run of urgentRuns) {
      const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sop/${run.sop.shareSlug}`;

      await resend.emails
        .send({
          from: "FlowMind <reminders@yourdomain.com>",
          to: run.executorEmail,
          subject: `⚠️ Reminder: ${run.sop.title} due soon`,
          html: `
            <div style="font-family: sans-serif; max-width: 500px;">
              <h2>⚠️ SOP Due Soon</h2>
              <p><strong>${run.sop.title}</strong> is due by ${run.deadlineAt?.toLocaleString()}.</p>
              <p>You've completed ${run.completedItems} of ${run.totalItems} steps.</p>
              <a href="${shareUrl}" style="display:inline-block;margin-top:12px;background:#dc2626;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">
                Complete Now →
              </a>
            </div>
          `,
        })
        .catch((err) => console.error("[deadline-reminder] email failed:", err));

      await prisma.executionRun.update({
        where: { id: run.id },
        data: { remindedAt: now },
      });
    }

    return { reminded: urgentRuns.length };
  }
);