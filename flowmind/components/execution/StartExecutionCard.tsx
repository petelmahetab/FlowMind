"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";

type Props = {
  sopId: string;
  onStarted: (run: { id: string; completedItems: number; totalItems: number }) => void;
};

export default function StartExecutionCard({ sopId, onStarted }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    if (!email.includes("@")) {
      setError("Enter a valid email so your progress can be tracked");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sop/${sopId}/runs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sopId,
          executorEmail: email.trim(),
          executorName: name.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start tracking");
        return;
      }
      onStarted(data);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <Play className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">
            Following this SOP for real?
          </p>
          <p className="text-xs text-gray-500 mt-0.5 mb-3">
            Enter your email so checking off steps actually tracks your progress —
            your manager can see how far along you are.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <button
              onClick={handleStart}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Start tracking
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}