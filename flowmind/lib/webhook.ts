import crypto from "crypto";


export function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
}


export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function deliverWebhook(
  url: string,
  secret: string,
  event: string,
  payload: object
): Promise<{ success: boolean; statusCode: number | null; error?: string }> {
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  const signature = signPayload(body, secret);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-FlowMind-Signature": `sha256=${signature}`,
        "X-FlowMind-Event": event,
      },
      body,
      signal: AbortSignal.timeout(10000), 
    });

    return { success: res.ok, statusCode: res.status };
  } catch (err) {
    return {
      success: false,
      statusCode: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}