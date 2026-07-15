import { serve } from "inngest/next";
import { inngest, sendWelcomeEmail, deliverWebhookWithRetry } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [sendWelcomeEmail, deliverWebhookWithRetry],
});