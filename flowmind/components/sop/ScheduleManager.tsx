"use client";

import { useState, useEffect } from "react";
import { X, Clock, Plus, Trash2, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

const PRESET_SCHEDULES = [
  { label: "Every Monday at 9 AM", cron: "0 9 * * 1" },
  { label: "Every Friday at 5 PM", cron: "0 17 * * 5" },
  { label: "Every day at 10 AM", cron: "0 10 * * *" },
  { label: "First of every month", cron: "0 9 1 * *" },
];

type Schedule = {
  id: string;
  cronLabel: string;
  assigneeEmails: string[];
  deadlineHours: number;
  isActive: boolean;
  nextRunAt: string;
  lastRunAt: string | null;
};

export default function ScheduleManager({
  sopId,
  onClose,
}: {
  sopId: string;
  onClose: () => void;
}) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedPreset, setSelectedPreset] = useState(PRESET_SCHEDULES[0]);
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [deadlineHours, setDeadlineHours] = useState(24);

  useEffect(() => {
    fetch(`/api/sop/${sopId}/schedules`)
      .then((r) => r.json())
      .then((d) => setSchedules(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [sopId]);

  function addEmail() {
    const trimmed = emailInput.trim();
    if (!trimmed.includes("@")) return;
    if (emails.includes(trimmed)) return;
    setEmails((prev) => [...prev, trimmed]);
    setEmailInput("");
  }

  async function handleCreate() {
    if (emails.length === 0) {
      toast.error("Please add at least one email");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/sop/${sopId}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cronExpression: selectedPreset.cron,
          cronLabel: selectedPreset.label,
          assigneeEmails: emails,
          deadlineHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create schedule");
        return;
      }
      setSchedules((prev) => [data, ...prev]);
      setShowForm(false);
      setEmails([]);
      toast.success("Schedule created!");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(scheduleId: string) {
    try {
      await fetch(`/api/sop/${sopId}/schedules`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId }),
      });
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      toast.success("Schedule removed");
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg shadow-xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Scheduled Runs
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {showForm ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">New Schedule</p>

              <div>
                <label className="text-xs text-gray-500 mb-2 block">Frequency</label>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_SCHEDULES.map((preset) => (
                    <button
                      key={preset.cron}
                      onClick={() => setSelectedPreset(preset)}
                      className={`text-xs px-3 py-2 rounded-lg border text-left transition-colors ${
                        selectedPreset.cron === preset.cron
                          ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-300"
                          : "bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-2 block flex items-center gap-1">
                  <Users className="w-3 h-3" /> Assignee emails
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                    placeholder="colleague@company.com"
                    className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={addEmail}
                    className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {emails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {emails.map((email) => (
                      <span
                        key={email}
                        className="flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full"
                      >
                        {email}
                        <button onClick={() => setEmails((p) => p.filter((e) => e !== email))}>
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-2 block flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Complete within
                </label>
                <select
                  value={deadlineHours}
                  onChange={(e) => setDeadlineHours(Number(e.target.value))}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={4}>4 hours</option>
                  <option value={8}>8 hours</option>
                  <option value={24}>24 hours</option>
                  <option value={48}>48 hours</option>
                  <option value={72}>72 hours</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex-1 text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-medium"
                >
                  {saving ? "Creating..." : "Create Schedule"}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add scheduled run
            </button>
          )}

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
          ) : schedules.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No schedules yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Automate recurring SOP runs — weekly deploys, monthly audits, daily standups
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((s) => (
                <div key={s.id} className="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {s.cronLabel}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400">
                        {s.assigneeEmails.length} assignee{s.assigneeEmails.length > 1 ? "s" : ""} ·{" "}
                        {s.deadlineHours}h deadline
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Next run: {new Date(s.nextRunAt).toLocaleString("en-IN")}
                      </p>
                      {s.lastRunAt && (
                        <p className="text-xs text-green-600 mt-0.5">
                          Last ran: {new Date(s.lastRunAt).toLocaleString("en-IN")}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}