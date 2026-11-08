"""Export a marimo notebook as islands. Prints JSON {"head": str, "body": str, "errors": [...]} to stdout.

On failure, prints a short error message to stderr and exits 1. Set ASTRO_MARIMO_DEBUG=1 for the traceback.

Usage: python islands_export.py <notebook.py> [--include-code] [--static]
"""

import asyncio
import json
import os
import sys
import traceback
from contextlib import redirect_stdout

from marimo import MarimoIslandGenerator
from marimo._session.notebook import load_notebook

ERROR_MIMETYPE = "application/vnd.marimo+error"


async def main(path: str, include_code: bool, reactive: bool) -> None:
    gen = MarimoIslandGenerator.from_file(path)
    # from_file applies one display_code to every cell; honour each cell's hide_code instead.
    cells = list(load_notebook(path).app.cell_manager.cell_data())
    for stub, cell in zip(gen._stubs, cells, strict=True):
        stub._display_code = include_code and not cell.config.hide_code
        stub._is_reactive = reactive
    # Cell stdout would otherwise corrupt our JSON.
    with redirect_stdout(sys.stderr):
        await gen.build()
    json.dump(
        {
            "head": gen.render_head(),
            # The init island is never removed by the runtime, so leave it out;
            # the runtime shows its own loading toast.
            "body": gen.render_body(include_init_island=False, include_payload=reactive),
            "errors": cell_errors(gen, cells),
        },
        sys.stdout,
    )


def cell_errors(gen: MarimoIslandGenerator, cells: list) -> list[dict]:
    """Errors raised by cells during the build, one per root cause (cells downstream of an error are skipped)."""
    errors = []
    for number, (stub, cell) in enumerate(zip(gen.stubs, cells), start=1):
        output = stub.output
        if output is None or output.mimetype != ERROR_MIMETYPE:
            continue
        for err in output.data:
            if getattr(err, "raising_cell", None):
                continue
            kind = getattr(err, "exception_type", None) or type(err).__name__
            msg = getattr(err, "msg", "")
            first_line = next((line.strip() for line in cell.code.splitlines() if line.strip()), "")
            errors.append({"cell": number, "code": first_line, "error": f"{kind}: {msg}" if msg else kind})
    return errors


if __name__ == "__main__":
    args = sys.argv[1:]
    try:
        asyncio.run(main(args[0], "--include-code" in args, "--static" not in args))
    except Exception as e:
        if os.environ.get("ASTRO_MARIMO_DEBUG"):
            traceback.print_exc()
        if isinstance(e, SyntaxError):
            # Line numbers are relative to the cell, not the file, so show the offending line instead.
            print(f"SyntaxError: {e.msg}\n    {(e.text or '').strip()}", file=sys.stderr)
        else:
            print(f"{type(e).__name__}: {e}", file=sys.stderr)
        sys.exit(1)
