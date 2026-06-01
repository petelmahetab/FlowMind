"use client";

import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";

type Props = {
  onClose: () => void;
  onCreated: (sop: any) => void;
};

const EXAMPLES = [
  "To deploy our app: push to main, SSH into server, run docker-compose up, check health endpoint, notify team",
  "Our hiring process: post job, screen resumes, phone screen, technical interview, offer letter, onboarding",
  "Monthly financial close: gather invoices, reconcile accounts, generate P&L, review with CFO, send to board",
];

export default function BrainDumpModal({ onClose, onCreated }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (text.trim().length < 20) {
      setError("Please describe your process in at least 20 characters");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "LIMIT_REACHED") {
          setError("You've reached the free limit. Please upgrade to Pro.");
        } else {
          setError(data.error ?? "Something went wrong. Try again.");
        }
        return;
      }

      onCreated(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Describe your process</h2>
            <p className="text-sm text-gray-400 mt-0.5">No structure needed — just write naturally</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. To deploy our app: first push to main branch, then SSH into the server..."
            className="w-full h-36 text-sm text-gray-800 placeholder-gray-300 border border-gray-200 rounded-xl px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={loading}
          />

          {/* Character count */}
          <div className="flex items-center justify-between mt-1 mb-4">
            <span className={`text-xs ${text.length < 20 ? "text-gray-300" : "text-green-500"}`}>
              {text.length} characters {text.length < 20 && `(${20 - text.length} more needed)`}
            </span>
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>

          {/* Examples */}
          <div className="mb-5">
            <p className="text-xs text-gray-400 mb-2">Try an example:</p>
            <div className="space-y-1.5">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setText(ex)}
                  className="text-left text-xs text-indigo-600 hover:text-indigo-800 block truncate w-full"
                >
                  → {ex.substring(0, 80)}...
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading || text.trim().length < 20}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating SOP...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate SOP
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
