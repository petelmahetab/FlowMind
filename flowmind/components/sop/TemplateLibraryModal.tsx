"use client";

import { useState, useMemo } from "react";
import { X, Search, FileText, ChevronRight } from "lucide-react";
import { SOP_TEMPLATES, TEMPLATE_CATEGORIES, type SopTemplate } from "@/lib/templates";

type Props = {
  onClose: () => void;
  onUse: (template: SopTemplate) => void;
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  hr:          { bg: "bg-teal-50 dark:bg-teal-950",   text: "text-teal-700 dark:text-teal-300",   border: "border-teal-200 dark:border-teal-800" },
  engineering: { bg: "bg-indigo-50 dark:bg-indigo-950", text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-800" },
  sales:       { bg: "bg-amber-50 dark:bg-amber-950",  text: "text-amber-700 dark:text-amber-300",  border: "border-amber-200 dark:border-amber-800" },
  operations:  { bg: "bg-rose-50 dark:bg-rose-950",    text: "text-rose-700 dark:text-rose-300",    border: "border-rose-200 dark:border-rose-800" },
  finance:     { bg: "bg-green-50 dark:bg-green-950",  text: "text-green-700 dark:text-green-300",  border: "border-green-200 dark:border-green-800" },
};

export default function TemplateLibraryModal({ onClose, onUse }: Props) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selected, setSelected] = useState<SopTemplate | null>(null);

  const filtered = useMemo(() => {
    return SOP_TEMPLATES.filter((t) => {
      const catMatch = activeCategory === "all" || t.category === activeCategory;
      const searchMatch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      return catMatch && searchMatch;
    });
  }, [search, activeCategory]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-2xl shadow-xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Template library</h2>
            <p className="text-xs text-gray-400 mt-0.5">{SOP_TEMPLATES.length} ready-to-use SOPs</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-gray-100"
            />
          </div>
          {/* Category pills */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  activeCategory === cat.id
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template grid */}
        <div className="overflow-y-auto flex-1 p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No templates found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((template) => {
                const colors = CATEGORY_COLORS[template.category] ?? CATEGORY_COLORS.hr;
                const isSelected = selected?.id === template.id;
                return (
                  <div
                    key={template.id}
                    onClick={() => setSelected(template)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950 dark:border-indigo-600"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center mb-2.5`}>
                      <FileText className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight mb-1">
                      {template.title}
                    </p>
                    <p className="text-xs text-gray-400 leading-snug mb-2">{template.description}</p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
                        {template.category}
                      </span>
                      <span className="text-xs text-gray-400">{template.steps.length} steps</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer — selected preview + use button */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
          {selected ? (
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{selected.title}</p>
              <p className="text-xs text-gray-400">{selected.steps.length} steps · {selected.category}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Select a template to continue</p>
          )}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => selected && onUse(selected)}
              disabled={!selected}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Use template
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}