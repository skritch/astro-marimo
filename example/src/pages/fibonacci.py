# /// astro
# title: Fibonacci Sequence
# description: Visualising the Fibonacci sequence with pure Python.
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
    # Fibonacci Sequence

    An interactive look at the Fibonacci sequence using only the Python standard library.
    """)
    return


@app.cell
def _(mo):
    n_slider = mo.ui.slider(5, 30, value=10, label="Terms to show")
    n_slider
    return (n_slider,)


@app.cell
def _(n_slider):
    def fibs(n: int) -> list[int]:
        a, b = 0, 1
        result = []
        for _ in range(n):
            result.append(a)
            a, b = b, a + b
        return result

    sequence = fibs(n_slider.value)
    sequence
    return (fibs, sequence)


@app.cell(hide_code=True)
def _(mo, sequence):
    mo.md(f"""
    The {len(sequence)}th Fibonacci number is **{sequence[-1]:,}**.
    """)
    return


if __name__ == "__main__":
    app.run()
