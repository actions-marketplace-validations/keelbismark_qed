// Q.E.D. High-Assurance Engineering Standard plugin for OpenCode
// Supports both OpenCode V1 and OpenCode V2 lifecycle hooks.

const QED_MARKER = "<EXTREMELY_IMPORTANT>\n# Q.E.D. High-Assurance Engineering Standard Active";

const QED_BOOTSTRAP = `${QED_MARKER}

Prime Directive: **Evidence Before Assertions**.
- Never claim code is functional without running tests and verifying execution output.
- Root cause only: No empty catch blocks, no arbitrary timeouts, no loose any casts.
- Search before you create: Grep for existing helpers/types before writing new ones.
- Blast Radius: Identify direct callers and indirect API/DB contract impact before modifying shared code.
- 4 Mandatory States: Always implement Empty, Loading, Error (with retry), and Degraded states.
- The 3 AM Test: Flat guard clauses, early returns, descriptive variables, zero opaque chained one-liners.
- Verification Gate: Typecheck, lint, and full test suite must pass before completion.

OpenCode Tool Mapping:
- Read a file: \`read_file\`
- Edit a file: \`edit_file\` / \`write_file\`
- Run a shell command: \`bash\`
- Search codebase: \`grep\` / \`glob\`
- Tasks: Maintain plan and progress in markdown task file
</EXTREMELY_IMPORTANT>`;

function injectBootstrapIntoMessages(messages) {
  if (!messages || !Array.isArray(messages)) return messages;

  const alreadyInjected = messages.some((m) => {
    const text = typeof m.content === "string"
      ? m.content
      : Array.isArray(m.parts)
        ? m.parts.map((p) => p.text).join("")
        : Array.isArray(m.content)
          ? m.content.map((p) => p.text).join("")
          : "";
    return text.includes("Q.E.D. High-Assurance Engineering Standard Active");
  });

  if (alreadyInjected) return messages;

  const userMessage = {
    role: "user",
    content: [{ type: "text", text: QED_BOOTSTRAP }],
  };

  return [userMessage, ...messages];
}

// V1 plugin export
export function SuperpowersPlugin() {
  return {
    "experimental.chat.messages.transform": async (_context, event) => {
      if (event && event.messages) {
        event.messages = injectBootstrapIntoMessages(event.messages);
      }
      return event;
    },
  };
}

// V2 plugin default export
export default {
  name: "qed",
  setup: async ({ session, skill }) => {
    const handler = async (event) => {
      if (event && event.messages) {
        return {
          ...event,
          messages: injectBootstrapIntoMessages(event.messages),
        };
      }
      return event;
    };

    if (session && typeof session.hook === "function") {
      await session.hook("context", handler);
      await session.hook("compaction", handler);
      await session.hook("generate", handler);
    }
  },
};
