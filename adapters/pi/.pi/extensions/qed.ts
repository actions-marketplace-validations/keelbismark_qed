import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const QED_MARKER = "<!-- Q.E.D. High-Assurance Standard Active -->";

export default function qedPiExtension(pi: any) {
  let injectConstitution = true;

  pi.on("session_start", async () => {
    injectConstitution = true;
  });

  pi.on("session_compact", async () => {
    injectConstitution = true;
  });

  pi.on("context", async (event: any) => {
    if (!injectConstitution) return;
    if (event.messages && event.messages.some((m: any) => JSON.stringify(m).includes(QED_MARKER))) return;

    const bootstrap = getConstitutionContent();
    if (!bootstrap) return;

    const bootstrapMessage = {
      role: "user" as const,
      content: [{ type: "text" as const, text: bootstrap }],
      timestamp: Date.now(),
    };

    const messages = event.messages ? [...event.messages] : [];
    // Insert after any leading compactionSummary messages
    let insertIndex = 0;
    while (insertIndex < messages.length && messages[insertIndex]?.role === "compactionSummary") {
      insertIndex++;
    }
    messages.splice(insertIndex, 0, bootstrapMessage);

    return {
      messages,
    };
  });
}

function getConstitutionContent(): string {
  return `${QED_MARKER}
<EXTREMELY_IMPORTANT>
# Q.E.D. High-Assurance Engineering Standard Active

Prime Directive: **Evidence Before Assertions**.
1. Never claim code is functional without running tests via \`bash\` and showing actual execution output.
2. Root cause only: No empty catch blocks, no arbitrary timeouts, no loose \`any\` casts.
3. Search before you create: Grep for existing helpers/types before writing new ones. Never duplicate.
4. Blast Radius: Identify direct callers and indirect API/DB impact before editing shared code.
5. The 4 Mandatory States: Always implement Empty, Loading, Error (with retry), and Degraded states.
6. The 3 AM Test: Flat guard clauses, early returns, descriptive variables, no 6-level chained one-liners.
7. Verification Gate: Verify type checks, linters, and full test suite before declaring completion.

Pi tool mapping:
- Read a file: \`read_file\`
- Edit a file: \`edit_file\` / \`write_file\`
- Run a shell command: \`bash\`
- Task tracking: maintain markdown todo checklist or plan file
- Subagents: run tasks inline with isolated context
</EXTREMELY_IMPORTANT>`;
}
