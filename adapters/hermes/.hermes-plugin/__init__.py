"""Q.E.D. High-Assurance Engineering Standard Plugin for Hermes Agent."""

QED_BOOTSTRAP = """<EXTREMELY_IMPORTANT>
# Q.E.D. High-Assurance Engineering Standard Active
Prime Directive: Evidence Before Assertions.
- Never assert code works without running tests and verifying output.
- Root cause only: No empty catch blocks, arbitrary timeouts, or loose any casts.
- Search before you create: Grep for existing helpers/types before writing new ones.
- Blast Radius: Identify callers and indirect contract impact before modifying shared code.
- 4 Mandatory States: Empty, Loading, Error (with retry), and Degraded states.
- The 3 AM Test: Flat guard clauses, early returns, no 6-method chained acrobatics.
- Verification Gate: Typecheck, lint, and test suite must pass before completion.
</EXTREMELY_IMPORTANT>"""


def pre_llm_call(ctx):
    """Inject Q.E.D. constitution into Hermes pre_llm_call hook."""
    if hasattr(ctx, "system_prompt"):
        if "Q.E.D. High-Assurance Engineering Standard Active" not in ctx.system_prompt:
            ctx.system_prompt = f"{QED_BOOTSTRAP}\n\n{ctx.system_prompt}"


def register(ctx):
    """Hermes plugin entry point."""
    if hasattr(ctx, "register_hook"):
        ctx.register_hook("pre_llm_call", pre_llm_call)
