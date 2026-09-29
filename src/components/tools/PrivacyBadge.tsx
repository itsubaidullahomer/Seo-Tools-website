import { ShieldCheck } from "lucide-react";

/** Trust line shown under every tool. Emphasises the "nothing leaves your browser" promise. */
export function PrivacyBadge({ files }: { files?: boolean }) {
  return (
    <p className="flex items-center gap-2 text-xs text-muted">
      <ShieldCheck className="h-4 w-4 text-success" aria-hidden />
      {files
        ? "Your files are processed on your device and never uploaded to a server."
        : "Runs entirely in your browser – nothing you enter is sent to or stored on our servers."}
    </p>
  );
}
