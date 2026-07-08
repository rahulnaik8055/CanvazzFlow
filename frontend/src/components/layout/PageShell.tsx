interface PageShellProps {
  children: React.ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <div className="min-h-screen bg-blue-300">
      <div className="w-full mx-auto px-6 py-10">{children}</div>
    </div>
  );
}
