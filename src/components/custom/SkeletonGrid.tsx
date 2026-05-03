import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface SkeletonGridProps {
  count?: number;
  columns?: string;
}

export function SkeletonGrid({
  count = 3,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
}: SkeletonGridProps) {
  return (
    <div className={`grid ${columns} gap-4`}>
      {[...Array(count)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="w-full h-32 bg-muted rounded-t-lg" />
          <CardHeader>
            <div className="h-4 bg-muted rounded w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="h-3 bg-muted rounded w-full mb-2" />
            <div className="h-3 bg-muted rounded w-4/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
