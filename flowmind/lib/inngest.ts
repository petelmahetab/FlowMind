import { Inngest } from "inngest";
import { Resend } from "resend";

export const inngest = new Inngest({ id: "flowmind" });

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Background function: send welcome email after user signs up ───
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
