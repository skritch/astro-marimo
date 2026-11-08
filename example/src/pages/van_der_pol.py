# /// astro
# title: Van der Pol Oscillator
# description: An interactive WASM notebook with numpy and matplotlib.
# mode: wasm
# ///
# /// script
# requires-python = ">=3.13"
# dependencies = [
#   "marimo>=0.25.0",
#   "numpy>=2.0",
#   "matplotlib>=3.9",
# ]
# ///

import marimo

__generated_with = "0.25.0"
app = marimo.App(width="medium")

with app.setup:
    import marimo as mo
    import numpy as np
    import matplotlib.pyplot as plt


@app.cell(hide_code=True)
def _():
    mo.md(r"""
    # Van der Pol Oscillator

    The Van der Pol oscillator is a harmonic oscillator whose damping depends
    on where it is. It was first studied by Balthasar van der Pol in the 1920s
    as a model of vacuum-tube circuits:

    $$
    \ddot{x} - \mu (1 - x^2)\,\dot{x} + x = 0
    $$

    For $\mu = 0$ this is the simple harmonic oscillator. For $\mu > 0$ the
    damping term changes sign. Near the origin ($|x| < 1$) the damping is
    *negative*, which pumps energy into the system. Far from it ($|x| > 1$)
    the damping is positive and takes energy out. Small oscillations grow and
    large ones shrink, so the system settles onto one oscillation in between:
    a **limit cycle**.

    Setting $y = \dot{x}$ gives a first-order system in the phase plane:

    $$
    \dot{x} = y, \qquad \dot{y} = \mu (1 - x^2)\, y - x
    $$

    The plot below draws this vector field. Drag the slider to change $\mu$.
    """)
    return


@app.cell
def _():
    mu_slider = mo.ui.slider(-1.0, 4.0, value=1.0, step=0.1, label="μ (nonlinear damping)")
    mu_slider
    return (mu_slider,)


@app.cell(hide_code=True)
def _(mu_slider):
    mu = mu_slider.value

    x = np.linspace(-3.5, 3.5, 28)
    y = np.linspace(-5.5, 5.5, 28)
    X, Y = np.meshgrid(x, y)
    dX = Y
    dY = mu * (1 - X**2) * Y - X

    fig, ax = plt.subplots(figsize=(5, 5))
    speed = np.sqrt(dX**2 + dY**2)
    ax.streamplot(x, y, dX, dY, density=1.5, color=speed, cmap="plasma", linewidth=1)
    ax.set_title(f"Van der Pol oscillator  (μ = {mu:.1f})")
    ax.set_xlabel("x")
    ax.set_ylabel("ẋ")
    ax.set_xlim(-3.5, 3.5)
    ax.set_ylim(-5.5, 5.5)
    plt.tight_layout()
    ax
    return


@app.cell(hide_code=True)
def _():
    mo.md(r"""
    ## The fixed point

    The only equilibrium is the origin, $(x, y) = (0, 0)$. Linearizing there
    drops the $x^2 y$ term and leaves the Jacobian

    $$
    J = \begin{pmatrix} 0 & 1 \\ -1 & \mu \end{pmatrix},
    \qquad
    \lambda = \frac{\mu \pm \sqrt{\mu^2 - 4}}{2}.
    $$

    The trace is $\mu$ and the determinant is $1$, so:

    - For $\mu < 0$ the origin is a stable spiral (or node). Every trajectory decays.
    - At $\mu = 0$ the eigenvalues are $\pm i$, giving a center. This is the harmonic oscillator.
    - For $0 < \mu < 2$ the eigenvalues are complex with positive real part, giving an **unstable spiral**.
    - For $\mu \geq 2$ the eigenvalues are real and positive, giving an **unstable node**.

    As $\mu$ passes through zero the origin loses stability and a limit cycle
    appears: this is a Hopf bifurcation.
    """)
    return


@app.cell(hide_code=True)
def _():
    mo.md(r"""
    ## An energy argument

    Take $E = \tfrac{1}{2}(x^2 + y^2)$, the energy of the undamped oscillator.
    Along trajectories,

    $$
    \dot{E} = x\dot{x} + y\dot{y} = \mu (1 - x^2)\, y^2.
    $$

    Inside the strip $|x| < 1$, $E$ increases, and outside it $E$ decreases.
    No trajectory can stay near the origin, and none can run off to infinity.
    That makes a closed orbit plausible. Liénard's theorem makes it rigorous:
    for every $\mu > 0$ there is exactly one limit cycle, and it is stable.
    Every trajectory except the fixed point itself spirals onto it.
    """)
    return


@app.cell(hide_code=True)
def _():
    mo.md(r"""
    ## Small and large $\mu$

    **Weak nonlinearity ($\mu \ll 1$).** The motion is nearly sinusoidal,
    $x(t) \approx A \cos t$, and the amplitude changes slowly. Averaging
    $\dot{E}$ over one period gives

    $$
    \frac{dA}{dt} \approx \frac{\mu}{2} A \left(1 - \frac{A^2}{4}\right),
    $$

    so the amplitude settles at $A = 2$. For small $\mu$ the limit cycle is
    close to a circle of radius 2, with period close to $2\pi$.

    **Strong nonlinearity ($\mu \gg 1$).** The cycle turns into a
    *relaxation oscillation*. The state creeps slowly along one branch of the
    cubic curve $y \approx \mu(x - x^3/3)$, reaches a turning point at
    $x = \pm 1$, then jumps quickly to the opposite branch. Almost all of the
    period is spent on the slow branches, and the period grows linearly:

    $$
    T \approx (3 - 2\ln 2)\,\mu \approx 1.61\,\mu.
    $$

    Try moving the slider from -1 up to 4. Below zero the streamlines spiral
    inward to the origin. At zero they are concentric circles. Above zero they
    gather into a loop that stretches into the lopsided shape
    of a relaxation oscillation.
    """)
    return


@app.cell(hide_code=True)
def _():
    mo.md(r"""
    ## Why it matters

    Relaxation oscillations are everywhere: heartbeats, firing neurons
    (FitzHugh–Nagumo is a direct descendant), dripping taps, squeaking
    hinges, and the multivibrator circuits van der Pol was studying. The
    common pattern is slow build-up followed by sudden release. The Van der
    Pol equation is about the simplest system that shows it, which is why it
    is still the standard first example of a limit cycle.
    """)
    return


if __name__ == "__main__":
    app.run()
