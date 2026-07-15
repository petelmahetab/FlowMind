"use client";

import { useState, useEffect } from "react";
import {
  X,
  Webhook,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const AVAILABLE_EVENTS = [
  {
    id: "run.completed",
    label: "Run Completed",
    desc: "When someone finishes executing a SOP",
  },
  {
    id: "run.started",
    label: "Run Started",
    desc: "When someone starts executing a SOP",
  },
  {
    id: "sop.created",
    label: "SOP Created",
    desc: "When a new SOP is created",
  },
];

type WebhookRecord = {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  deliveries: {
    success: boolean;
    statusCode: number | null;
    createdAt: string;
  }[];
};

type Props = { onClose: () => void };

export default function WebhookManager({ onClose }: Props) {
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);

  useEffect(() => {
    fetch("/api/webhooks/user")
      .then((r) => r.json())
      .then((d) => setWebhooks(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!url || !selectedEvents.length) {
      toast.error("URL aur kam se kam ek event select karo");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/webhooks/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, events: selectedEvents }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      setWebhooks((prev) => [data, ...prev]);
      setNewSecret(data._secretOnce);
      setShowForm(false);
      setUrl("");
      setSelectedEvents([]);
      toast.success("Webhook registered!");
    } catch {
      toast.error("Failed to create webhook");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(webhookId: string) {
    try {
      await fetch("/api/webhooks/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId }),
      });
      setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
      toast.success("Webhook removed");
    } catch {
      toast.error("Failed to delete");
    }
  }

  function copySecret() {
    if (!newSecret) return;
    navigator.clipboard.writeText(newSecret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Webhook className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Webhooks
            </h2>
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {webhooks.length} registered
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Secret display — sirf ek baar */}
          {newSecret && (
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
                ⚠️ Save this secret now — it won&apos;t be shown again
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white dark:bg-gray-900 px-3 py-2 rounded-lg border border-amber-200 truncate font-mono">
                  {newSecret}
                </code>
                <button
                  onClick={copySecret}
                  className="flex items-center gap-1 text-xs px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex-shrink-0"
                >
                  {secretCopied ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {secretCopied ? "Copied!" : "Copy"}
                </button>
              </div>
              <button
                onClick={() => setNewSecret(null)}
                className="text-xs text-amber-600 mt-2 underline"
              >
                I&apos;ve saved it — dismiss
              </button>
            </div>
          )}

          {/* Add new webhook form */}
          {showForm ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Register new webhook
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Endpoint URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://your-server.com/webhook"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">
                    Events to subscribe
                  </label>
                  <div className="space-y-2">
                    {AVAILABLE_EVENTS.map((ev) => (
                      <label
                        key={ev.id}
                        className="flex items-start gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(ev.id)}
                          onChange={(e) => {
                            if (e.target.checked)
                              setSelectedEvents((p) => [...p, ev.id]);
                            else
                              setSelectedEvents((p) =>
                                p.filter((x) => x !== ev.id),
                              );
                          }}
                          className="mt-0.5"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {ev.label}
                          </p>
                          <p className="text-xs text-gray-400">{ev.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={saving}
                    className="flex-1 text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors"
                  >
                    {saving ? "Registering..." : "Register webhook"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add webhook endpoint
            </button>
          )}

          {/* Existing webhooks list */}
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
          ) : webhooks.length === 0 && !showForm ? (
            <div className="text-center py-10">
              <Webhook className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No webhooks yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Register an endpoint to receive SOP events
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh) => {
                const recentSuccess = (wh.deliveries ?? []).filter(
                  (d) => d.success,
                ).length;
                const recentTotal = (wh.deliveries ?? []).length;
                return (
                  <div
                    key={wh.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
                          {wh.url}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {wh.events.map((ev) => (
                            <span
                              key={ev}
                              className="text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(wh.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {recentTotal > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                        {recentSuccess === recentTotal ? (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                        {recentSuccess}/{recentTotal} recent deliveries
                        successful
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
