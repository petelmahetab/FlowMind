import { Inngest } from "inngest";
import { Resend } from "resend";
import { prisma } from "./prisma";
import { deliverWebhook } from "./webhook";

export const inngest = new Inngest({ id: "flowmind" });

const resend = new Resend(process.env.RESEND_API_KEY);

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
        <p>Head back and try: describe any process in plain English and watch AI turn it into a structured runbook.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background:#6366f1;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px">
          Go to Dashboard →
        </a>
        <p style="margin-top:24px;color:#888;font-size:13px">
          FlowMind — turn messy processes into clear SOPs
        </p>
      `,
    });

    return { sent: true };
  }
);


export const deliverWebhookWithRetry = inngest.createFunction(
  {
    id: "deliver-webhook",
    retries: 3, // automatic retry 3 baar
    rateLimit: {
      limit: 100,
      period: "1m",
    },
  },
  { event: "webhook/deliver" },
  async ({ event, step }) => {
    const { webhookId, deliveryId, url, secret, eventName, payload } = event.data;

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


export async function triggerWebhooks(
  userId: string,
  eventName: string,
  payload: object
) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      userId,
      isActive: true,
      events: { has: eventName },
    },
  });

  for (const webhook of webhooks) {
    // Delivery record create karo
    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: eventName,
        payload,
        attempts: 0,
      },
    });

    // Inngest event send karo — yeh retry handle karega
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