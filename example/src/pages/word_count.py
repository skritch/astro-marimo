# /// astro
# title: Word Count
# description: Count word frequencies in any text using Python's standard library.
# ///

import marimo

__generated_with = "0.24.2"
app = marimo.App(width="medium")


@app.cell
def _():
    import marimo as mo
    return (mo,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    # Word Count

    Paste any text below and see the most common words.
    """)
    return


@app.cell
def _(mo):
    text_input = mo.ui.text_area(
        value="the quick brown fox jumps over the lazy dog the fox",
        label="Text to analyse",
        rows=4,
    )
    text_input
    return (text_input,)


@app.cell
def _(mo, text_input):
    from collections import Counter

    words = text_input.value.lower().split()
    counts = Counter(words).most_common(10)

    mo.ui.table(
        [{"word": w, "count": c} for w, c in counts],
        label="Top words",
    )
    return (Counter, counts, words)


@app.cell(hide_code=True)
def _(mo, words):
    mo.md(f"""
    **{len(words)} total words**, **{len(set(words))} unique**.
    """)
    return


if __name__ == "__main__":
    app.run()
