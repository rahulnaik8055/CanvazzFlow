import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  search?: string;
  onSearch?: (val: string) => void;
  searchPlaceholder?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  search,
  onSearch,
  searchPlaceholder = "Search...",
  refreshing,
  onRefresh,
}: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-6 w-full mb-8">
      {/* Left — title + search side by side */}
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>

        {onSearch && (
          <div className="relative w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
            <Input
              value={search ?? ""}
              onChange={(e) => onSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 h-9"
            />
          </div>
        )}
      </div>

      {/* Right — refresh + action pinned to right */}
      <div className="flex items-center gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={refreshing}
            className="h-9 w-9"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        )}
        {actionLabel && onAction && (
          <Button onClick={onAction}>+ {actionLabel}</Button>
        )}
      </div>
    </div>
  );
}
