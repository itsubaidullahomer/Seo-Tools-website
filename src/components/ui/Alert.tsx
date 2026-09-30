import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "error";

const styles: Record<AlertVariant, { box: string; icon: string; Icon: typeof Info }> = {
  info: { box: "bg-surface-2 border-border-strong", icon: "text-fg-secondary", Icon: Info },
  success: { box: "bg-success-soft border-success/30", icon: "text-success", Icon: CheckCircle2 },
  warning: { box: "bg-warning-soft border-warning/30", icon: "text-warning", Icon: AlertTriangle },
  error: { box: "bg-danger-soft border-danger/30", icon: "text-danger", Icon: XCircle },
};

export function Alert({ variant = "info", title, children, className }: { variant?: AlertVariant; title?: ReactNode; children?: ReactNode; className?: string }) {
  const { box, icon, Icon } = styles[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm text-fg", box, className)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", icon)} aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "text-fg-secondary")}>{children}</div>}
      </div>
    </div>
  );
}
