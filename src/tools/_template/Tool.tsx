"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { CopyButton } from "@/components/ui/CopyButton";
import { ResultBox } from "@/components/ui/ResultBox";
import { ToolPanel, ToolActions } from "@/components/ui/ToolPanel";

/**
 * __NAME__
 *
 * Rules for tool components:
 * - Must be a client component ("use client") with a default export.
 * - Never touch `window`/`document` during render – only inside effects/handlers
 *   (the component is server-rendered for SEO).
 * - Do all processing locally; never send user data to a server.
 * - Use the shared UI kit in src/components/ui for consistent styling.
 */
export default function ToolTemplate() {
  const [input, setInput] = useState("");
  const output = input.trim().toUpperCase();

  return (
    <ToolPanel>
      <Textarea
        label="Input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste or type your text here…"
        rows={6}
      />
      <ToolActions>
        <Button variant="secondary" onClick={() => setInput("")} disabled={!input}>
          Clear
        </Button>
        <CopyButton text={output} disabled={!output} />
      </ToolActions>
      <ResultBox label="Result" value={output} placeholder="Your result will appear here" />
    </ToolPanel>
  );
}
