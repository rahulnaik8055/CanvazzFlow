interface Request {
  id: string;
  user: { id: string; name: string; email: string };
  project: { id: string; name: string };
  message?: string;
  createdAt: string;
}

export function AccessRequests({
  requests,
  onApprove,
  onDeny,
}: {
  requests: Request[];
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {requests.map((req) => (
        <div
          key={req.id}
          className="bg-white border rounded-xl px-5 py-4 flex items-center justify-between gap-4"
        >
          <div className="min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-medium">{req.user.name}</span>
              {" wants to join "}
              <span className="font-medium">{req.project.name}</span>
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{req.user.email}</p>
            {req.message && (
              <p className="text-xs text-gray-500 mt-1 italic">
                "{req.message}"
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onApprove(req.id)}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => onDeny(req.id)}
              className="text-xs px-3 py-1.5 rounded-lg border text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Deny
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
