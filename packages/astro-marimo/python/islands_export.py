"""Export a marimo notebook as islands. Prints JSON {"head": str, "body": str} to stdout.

Usage: python islands_export.py <notebook.py> [--include-code] [--static]
"""

import asyncio
import json
import sys
from contextlib import redirect_stdout

from marimo import MarimoIslandGenerator
from marimo._session.notebook import load_notebook


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
        },
        sys.stdout,
    )


if __name__ == "__main__":
    args = sys.argv[1:]
    asyncio.run(main(args[0], "--include-code" in args, "--static" not in args))
