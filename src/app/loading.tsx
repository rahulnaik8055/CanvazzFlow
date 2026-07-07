import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={24} className="animate-spin text-gray-300" />
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
