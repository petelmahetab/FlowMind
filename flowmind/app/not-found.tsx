import Link from "next/link";
import { FileX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <FileX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
        <p className="text-gray-500 mb-6">
          This SOP doesn't exist or hasn't been made public.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-indigo-700 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
