import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QueryErrorStateProps {
  title?: string;
  description?: string;
  onRetry: () => unknown;
  isRetrying?: boolean;
  className?: string;
}

export function QueryErrorState({
  title = "Couldn't load this",
  description = "Check your connection and try again.",
  onRetry,
  isRetrying = false,
  className,
}: QueryErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h2 className="font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => void onRetry()}
        disabled={isRetrying}
        className="mt-1"
      >
        <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} aria-hidden="true" />
        {isRetrying ? "Trying again…" : "Try again"}
      </Button>
    </div>
  );
}
