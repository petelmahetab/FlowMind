"use client";

import { useState } from "react";
import { PlayCircle } from "lucide-react";

type Props = {
  onStart: (email: string, name?: string) => void;
};

export default function StartRunModal({ onStart }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-indigo-200 dark:border-indigo-900 p-5 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <PlayCircle className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          Start tracking your progress
        </h3>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Enter your details to track which steps you complete
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-100"
        />
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-100"
        />
        <button
          onClick={() => email && onStart(email, name || undefined)}
          disabled={!email}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors whitespace-nowrap"
        >
          Start
        </button>
      </div>
    </div>
  );
}