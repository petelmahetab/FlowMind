export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="font-bold text-indigo-600 text-lg">FlowMind</span>
        <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
      </div>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-10 w-28 bg-indigo-100 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
                <div>
                  <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mb-1.5" />
                  <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
