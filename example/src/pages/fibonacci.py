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


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Ratios and the Golden Ratio

    A fascinating property of the Fibonacci sequence is that the ratio of consecutive
    terms converges to the **golden ratio** φ ≈ 1.6180339887…
    """)
    return


@app.cell
def _(sequence):
    ratios = [round(sequence[i+1] / sequence[i], 6) for i in range(1, len(sequence)-1) if sequence[i] != 0]
    ratios
    return (ratios,)


@app.cell(hide_code=True)
def _(mo, ratios):
    phi = (1 + 5**0.5) / 2
    error = abs(ratios[-1] - phi) if ratios else None
    mo.md(f"""
    Last ratio: **{ratios[-1]}** — error from φ: `{error:.2e}`
    """)
    return (phi,)


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Cumulative Sums

    Another pattern: the sum of the first *n* Fibonacci numbers equals F(n+2) − 1.
    We can verify this holds for our sequence.
    """)
    return


@app.cell
def _(sequence):
    cumulative = []
    total = 0
    for f in sequence:
        total += f
        cumulative.append(total)
    cumulative
    return (cumulative,)


@app.cell(hide_code=True)
def _(cumulative, mo, sequence):
    checks = [cumulative[i] == sequence[i+2] - 1 for i in range(len(cumulative)-2)]
    all_pass = all(checks)
    mo.md(f"""
    Identity holds for all checked terms: **{all_pass}**
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    mo.md(r"""
    ## Odd and Even Terms

    Every third Fibonacci number is even; the rest are odd. Let's confirm and count.
    """)
    return


@app.cell
def _(sequence):
    evens = [(i, f) for i, f in enumerate(sequence) if f % 2 == 0]
    evens
    return (evens,)


@app.cell(hide_code=True)
def _(evens, mo, sequence):
    mo.md(f"""
    **{len(evens)}** even numbers out of {len(sequence)} terms.
    Indices of even terms: {[i for i, _ in evens]}
    """)
    return


if __name__ == "__main__":
    app.run()
