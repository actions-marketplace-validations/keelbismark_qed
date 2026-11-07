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

    return {
      messages: [bootstrapMessage, ...(event.messages || [])],
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
</EXTREMELY_IMPORTANT>`;
}
