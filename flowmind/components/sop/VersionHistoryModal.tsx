"use client";

import { useState, useEffect } from "react";
import { X, History, Clock } from "lucide-react";

type SopVersion = {
  id: string;
  versionNumber: number;
  title: string;
  changeSummary: string | null;
  editedBy: string | null;
  createdAt: string;
};

type Props = {
  sopId: string;
  onClose: () => void;
};

export default function VersionHistoryModal({ sopId, onClose }: Props) {
  const [versions, setVersions] = useState<SopVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sop/${sopId}/versions`)
      .then((res) => res.json())
      .then((data) => setVersions(data))
      .finally(() => setLoading(false));
  }, [sopId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md shadow-xl flex flex-col max-h-[75vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Version history</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading...</p>
          ) : versions.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No version history yet</p>
              <p className="text-xs text-gray-400 mt-1">Versions are saved when SOP is edited</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((v) => (
                <div key={v.id} className="border border-gray-100 dark:border-gray-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                      v{v.versionNumber}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(v.createdAt).toLocaleDateString()} {new Date(v.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{v.changeSummary}</p>
                  {v.editedBy && (
                    <p className="text-xs text-gray-400 mt-1">by {v.editedBy}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}