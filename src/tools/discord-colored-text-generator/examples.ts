import { docFromSegments, type Doc, type ExampleSegment } from "./logic";

export interface Example {
  id: string;
  label: string;
  doc: Doc;
}

const rules: ExampleSegment[] = [
  { text: "SERVER RULES", style: { bold: true, underline: true, fg: 33 } },
  { text: "\n\n" },
  { text: "1. ", style: { fg: 36 } },
  { text: "Be kind and respectful.\n" },
  { text: "2. ", style: { fg: 36 } },
  { text: "No spam or self-promotion.\n" },
  { text: "3. ", style: { fg: 36 } },
  { text: "Keep topics in the right channel.\n\n" },
  { text: "Breaking a rule can mean a mute or a ban.", style: { fg: 31 } },
];

const announcement: ExampleSegment[] = [
  { text: "GAME NIGHT", style: { bold: true, fg: 35 } },
  { text: "\n" },
  { text: "When:", style: { fg: 33 } },
  { text: " Friday at 8 PM\n" },
  { text: "Where:", style: { fg: 33 } },
  { text: " Voice lobby\n" },
  { text: "Prize:", style: { fg: 33 } },
  { text: " a custom role for the winner\n\n" },
  { text: "Reply here if you are coming.", style: { fg: 32 } },
];

const status: ExampleSegment[] = [
  { text: "Bot       " },
  { text: "ONLINE", style: { bold: true, fg: 32 } },
  { text: "\nWebsite   " },
  { text: "MAINTENANCE", style: { fg: 33 } },
  { text: "\nVoice     " },
  { text: " OFFLINE ", style: { bold: true, fg: 37, bg: 41 } },
];

export const EXAMPLES: Example[] = [
  { id: "rules", label: "Server rules", doc: docFromSegments(rules) },
  { id: "announcement", label: "Announcement", doc: docFromSegments(announcement) },
  { id: "status", label: "Status board", doc: docFromSegments(status) },
];
