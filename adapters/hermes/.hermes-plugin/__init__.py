"""Q.E.D. High-Assurance Engineering Standard Plugin for Hermes Agent."""

BOOTSTRAP_MARKER = "superpowers:using-qed bootstrap for hermes"

QED_BOOTSTRAP = f"""<EXTREMELY_IMPORTANT>
<!-- {BOOTSTRAP_MARKER} -->
# Q.E.D. High-Assurance Engineering Standard Active

Prime Directive: **Evidence Before Assertions**.
- Never claim code is functional without running tests and verifying execution output.
- Root cause only: No empty catch blocks, arbitrary timeouts, or loose any casts.
- Search before you create: Grep for existing helpers/types before writing new ones.
- Blast Radius: Identify callers and indirect contract impact before modifying shared code.
- 4 Mandatory States: Always implement Empty, Loading, Error (with retry), and Degraded states.
- The 3 AM Test: Flat guard clauses, early returns, descriptive variables, no 6-level chained acrobatics.
- Verification Gate: Typecheck, lint, and full test suite must pass before completion.

Hermes Tool Mapping:
- Read a file: `read_file`
- Edit a file: `edit_file` / `write_file`
- Shell execution: `bash`
- Search codebase: `grep` / `glob`
- Subagents: Delegate via Hermes subagent profiles
</EXTREMELY_IMPORTANT>"""


def pre_llm_call(is_first_turn=False, platform="cli", **kwargs):
    """Hermes pre_llm_call hook.

    Injects Q.E.D. bootstrap on the first turn of non-subagent platforms.
    Accepts arbitrary **kwargs from Hermes runtime.
    """
    if is_first_turn and platform != "subagent":
        return {"context": QED_BOOTSTRAP}
    return None


def register(ctx):
    """Hermes plugin entry point."""
    if hasattr(ctx, "register_hook"):
        ctx.register_hook("pre_llm_call", pre_llm_call)
