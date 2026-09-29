import { ShieldCheck } from "lucide-react";

/** Trust line shown under every tool. Emphasises the "nothing leaves your browser" promise. */
export function PrivacyBadge({ files }: { files?: boolean }) {
  return (
    <p className="flex items-center gap-2 font-mono text-[11px] text-muted">
      <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
      {files ? "Files are processed on your device and never uploaded." : "Runs locally in your browser – nothing you enter is sent or stored."}
    </p>
  );
}
