interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: string;
}

export function EmptyState({
  title = "Nothing here yet",
  description = "Create your first one to get started.",
  icon = "◻",
}: EmptyStateProps) {
  return (
    <div className="text-center py-20 text-muted-foreground">
      <p className="text-4xl mb-3">{icon}</p>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <p className="text-xs mt-1">{description}</p>
    </div>
  );
}
