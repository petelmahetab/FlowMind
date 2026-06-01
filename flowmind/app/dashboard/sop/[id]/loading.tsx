export default function SopEditorLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="h-3 w-12 bg-indigo-100 rounded animate-pulse mb-3" />
          <div className="h-6 w-64 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-96 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-gray-100 rounded animate-pulse mt-1" />
                <div className="w-6 h-6 rounded-full bg-indigo-100 animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
