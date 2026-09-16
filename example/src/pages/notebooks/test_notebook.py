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
    # Some Markdown

    Testy test test.
    """)
    return


@app.cell(hide_code=True)
def _(mo):
    name = mo.ui.text(placeholder="Your name here")
    mo.md(
      f"""
      Hi! What's your name?

      {name}
      """
    )
    return (name,)


@app.cell(hide_code=True)
def _(mo, name):
    mo.md(
      f"""
      Hello, {name.value}!
      """
    )
    return


if __name__ == "__main__":
    app.run()
