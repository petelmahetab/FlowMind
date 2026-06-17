"use client";

import { useState } from "react";
import { X, UserPlus, Calendar } from "lucide-react";
import { toast } from "sonner";

type Props = {
  sopId: string;
  onClose: () => void;
};

export default function AssignModal({ sopId, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAssign() {
    if (!email.trim()) {
      toast.error("Email zaroori hai");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Assigning SOP...");

    try {
      const res = await fetch(`/api/sop/${sopId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), dueDate: dueDate || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to assign", { id: toastId });
        return;
      }

      toast.success(`Assigned to ${email}`, { id: toastId });
      onClose();
    } catch {
      toast.error("Something went wrong", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-sm shadow-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Assign SOP</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
              Team member's email
            </label>
            <input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-100"
            />
            <p className="text-xs text-gray-400 mt-1">They must have a FlowMind account</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Due date (optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={submitting}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors"
          >
            {submitting ? "Assigning..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}