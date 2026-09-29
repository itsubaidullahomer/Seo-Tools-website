import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type AlertVariant = "info" | "success" | "warning" | "error";

const styles: Record<AlertVariant, { box: string; Icon: typeof Info }> = {
  info: { box: "bg-primary-soft text-fg border-primary/20", Icon: Info },
  success: { box: "bg-success-soft text-fg border-success/30", Icon: CheckCircle2 },
  warning: { box: "bg-warning-soft text-fg border-warning/30", Icon: AlertTriangle },
  error: { box: "bg-danger-soft text-fg border-danger/30", Icon: XCircle },
};

export function Alert({ variant = "info", title, children, className }: { variant?: AlertVariant; title?: ReactNode; children?: ReactNode; className?: string }) {
  const { box, Icon } = styles[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border px-4 py-3 text-sm", box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cn(title && "mt-0.5", "text-fg-secondary")}>{children}</div>}
      </div>
    </div>
  );
}
