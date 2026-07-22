import { serve } from "inngest/next";
import {
  inngest,
  sendWelcomeEmail,
  deliverWebhookWithRetry,
  checkDueSchedules,
  sendDeadlineReminders,
} from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendWelcomeEmail,
    deliverWebhookWithRetry,
    checkDueSchedules,
    sendDeadlineReminders,
  ],
});