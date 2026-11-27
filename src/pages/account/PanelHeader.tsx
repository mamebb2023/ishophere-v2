import { CardHeader } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface PanelHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  tone?: "default" | "danger";
}

export function PanelHeader({
  icon: Icon,
  title,
  description,
  tone = "default",
}: PanelHeaderProps) {
  return (
    <CardHeader className="flex-row items-start gap-3 space-y-0">
      <span
        className={
          tone === "danger"
            ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive"
            : "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
        }
      >
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-snug tracking-tight">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </CardHeader>
  );
}
