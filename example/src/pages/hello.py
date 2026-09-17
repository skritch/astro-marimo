import marimo

__generated_with = "0.24.2"
app = marimo.App()


@app.cell
def _():
    import marimo as mo

    return (mo,)


@app.cell
def _(mo):
    mo.md("""
    # Hello, Marimo!

    This is a Marimo notebook rendered as a static Astro page.
    """)
    return


@app.cell
def _(mo):
    items = ["apples", "bananas", "cherries"]
    mo.md("\n".join(f"- {item}" for item in items))
    return


if __name__ == "__main__":
    app.run()
