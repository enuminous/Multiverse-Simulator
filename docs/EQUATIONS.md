# Model specification — frozen at engine 1.0.0

## 1. From narrative equation to an executable state

The conversation proposed

\[
i\hbar\partial_t\Psi_a[\Phi,\mathcal M;t]
=\widehat H_a\Psi_a+\sum_{b\ne a}\widehat K_{ab}\Psi_b.
\]

This is a mathematical architecture, not a specified theory: the field content,
operators, initial state, and memory semantics were not yet fixed. The simulator
chooses a **finite observer-location model** rather than pretending to integrate
an entire quantum field configuration space.

\[
\mathcal H=\mathbb C^N\otimes\mathbb C^2,
\qquad |a,m\rangle,
\qquad a=0,\ldots,N-1,\quad m\in\{0,1\}.
\]

The state is a density matrix \(\rho\) of dimension \(2N\). The two labels denote
the modeled world and a portable one-bit record. They do not represent full
universes, complete human memories, or a literal multiverse field theory.
The tensor ordering in code is `index = 2*world + memory`.

Natural quantum units set \(\hbar=1\). Energies and couplings therefore have
units of inverse model time. These units are not mapped to physical seconds or
joules. All parameter controls are bounded in `src/engine.js`.

## 2. Hamiltonian

\[
H_{am,bn}=\delta_{mn}\left[
\delta_{ab}\left(d\epsilon_a+\eta m v_a+g\phi(x_a)\right)
+\kappa A_{ab}B_{ab}\right],
\qquad v_a=\cos(2\pi a/N).
\]

- \(d\): the energy-contrast control (`detuning`).
- \(\epsilon_a\): fixed preset world energies.
- \(\eta\): memory-dependent energy shift (`memoryBias`).
- \(g\): field-to-world energy coupling (`feedbackGain`). This term is absent
  when `fieldEnabled` is false.
- \(A\): symmetric, zero-diagonal adjacency matrix defined by preset edges.
- \(\kappa\): portal coupling, shared by the edges.
- \(B\): symmetric mask. When the curve is closed, links between the two
  designated groups are removed. Links within each group remain.

Because every parameter is real and \(A_{ab}B_{ab}=A_{ba}B_{ba}\), \(H=H^\dagger\).
The Hamiltonian does not flip the record bit. The bit can affect world transport
through the diagonal energy term, but its marginal changes only at explicit
record/discard interventions.

For the two-world preset with zero detuning, \(H=\kappa\sigma_x\) in each record
sector. Starting in world 0 gives

\[
p_1(t)=\sin^2(\kappa t).
\]

With world energies \((0,\Delta)\),

\[
p_1(t)=\frac{\kappa^2}{\Omega^2}\sin^2(\Omega t),
\quad\Omega=\sqrt{\kappa^2+\Delta^2/4}.
\]

These are independent analytic references used by the tests.

## 3. Memory operations

**Record at world a:** apply a controlled NOT,

\[
U_{\rm rec,a}=|a\rangle\langle a|\otimes X+
(I-|a\rangle\langle a|)\otimes I.
\]

This records a binary distinction in a ready register. Applying the gate twice
undoes it: it is a reversible toggle, not cumulative autobiographical memory.
It can correlate the world and record without copying an arbitrary quantum state.

**Jump:** a selected pair of world labels is swapped by

\[
U_{\rm jump}=P_{ab}\otimes I_2.
\]

This deliberate intervention preserves the reduced memory state. It is distinct
from continuous Hamiltonian transfer. It swaps amplitudes in both directions,
not an irreversible relocation or a sampled measurement outcome. The intervention
is an external operation and may bypass the graph's current edge mask.

**Discard:** reset the register using the quantum channel

\[
\rho\longmapsto\operatorname{Tr}_{\mathcal M}(\rho)
\otimes|0\rangle\langle0|.
\]

This leaves the reduced-world state unchanged. Discarding a record does not
restore previously lost world coherence. It is an open-system operation; its
physical implementation and thermodynamic cost are not modeled.

## 4. Dephasing

With \(P_a=|a\rangle\langle a|\otimes I_2\),

\[
\dot\rho=-i[H,\rho]+\gamma\left(\sum_a P_a\rho P_a-\rho\right).
\]

The exact isolated channel for duration \(\tau\) multiplies matrix entries with
different world labels by \(e^{-\gamma\tau}\), leaving entries in the same world
block unchanged. Equivalently,

\[
\mathcal D_\tau(\rho)=e^{-\gamma\tau}\rho+
(1-e^{-\gamma\tau})\sum_aP_a\rho P_a.
\]

This is a convex combination of two completely positive trace-preserving maps.
It does not select an outcome. No random collapse or inter-world communication
mechanism is inferred from ordinary quantum theory.

For an initially uniform N-world superposition with \(H=0\),

\[
C(t)=e^{-\gamma t},\qquad
\operatorname{Tr}\rho^2=\frac1N+\frac{N-1}{N}e^{-2\gamma t}.
\]

## 5. Quantum integrator

For each frozen Hamiltonian step, a real-symmetric Jacobi eigensolver gives
\(H=V\Lambda V^T\). Then

\[
U=V\operatorname{diag}(e^{-i\lambda_j\Delta t})V^T,
\quad\rho_{n+1}=\mathcal D_{\Delta t/2}
\left(U\mathcal D_{\Delta t/2}(\rho_n)U^\dagger\right).
\]

For time-independent H, the unitary step is exact up to eigensolver and floating
point error. Dephasing/unitary splitting is second order for fixed H. Each
component preserves trace and positivity in exact arithmetic. The code never
renormalizes the density matrix to conceal drift.

Eigenvalues are converged to absolute off-diagonal tolerance `1e-13`; the
parameter ranges keep matrix entries on a bounded scale in the intended short
experiments. The validation suite tests trace, Hermiticity, positivity, exact
solutions, and reversal. Long runs at extreme feedback settings need additional
convergence study; a finite output is not an accuracy certificate.

## 6. EFMW scalar source adapter

The EFMW scalar template supplied in the task context is

\[
\nabla^2\phi-\frac{1}{c^2}\partial_t^2\phi
=\frac{4\pi}{c^2}(E+cP).
\]

Rearranging gives

\[
\partial_t^2\phi=c^2\nabla^2\phi-4\pi(E+cP).
\]

The definitions and dimensions of \(E,P,\phi\), a physical source law, and a
physical calibration were **not** specified in this request. We therefore do
not identify a slider with measured energy or momentum. Instead we introduce
the normalized source \(S\), reduce space to one dimension, and optionally add
phenomenological damping:

\[
\boxed{\phi_{tt}+2\zeta\phi_t-c_*^2\phi_{xx}=-S(x,t).}
\]

For a prospective physical calibration \(x=L_0x_*\), \(t=T_0t_*\),
\(\phi=\Phi_0u\), the required identifications would be

\[
c_* = cT_0/L_0,\qquad
S_* = 4\pi T_0^2(E+cP)/\Phi_0.
\]

Only the normalized variables are used by this release. The minus sign on S
follows the rearrangement; a positive source initially drives a negative field.
Damping is an added modeling choice, absent from the supplied root template.

The periodic domain has length 24 and 128 grid points by default; \(\Delta t=0.025\),
\(c_*=1\), so the default Courant ratio is \(c_*\Delta t/\Delta x=0.13333\ldots\).
Configuration validation requires this ratio to be at most 0.9.

The spatial Laplacian is the centered second difference. Velocity Verlet advances
position and velocity. Damping is split into half-steps: velocity is multiplied
by \(e^{-\zeta\Delta t}\) before and after the undamped Verlet step, producing
the rate \(2\zeta\). Initial field and velocity are zero unless a test sets them.

Experiment 05 uses

\[
S(x,t)=A G(x-x_0)\sin^2(\pi t/3)\quad(0\le t\le3),
\]

and zero source afterward. \(G=\exp[-d_{\rm periodic}^2/(2\sigma^2)]\),
\(\sigma=0.65\). This is a peak-normalized Gaussian, not a unit-integral density.

## 7. Proposed hybrid feedback

Experiment 06 chooses

\[
S(x,t)=A\sum_a p_a(t)G(x-x_a),\qquad
H_{aa}\supset g\phi(x_a,t),
\quad x_a=(a+1/2)L/N.
\]

At each step the quantum Hamiltonian uses the old field; the field source uses
the old world populations. The source is held fixed across the field step.
Linear interpolation samples \(\phi(x_a)\). This explicit coupling is generally
**first order in time as a combined hybrid scheme**, despite the higher-order
subsystem solvers. It is not a unitary evolution of a combined quantum field.

Trace is preserved for each quantum step, even though the state-dependent hybrid
evolution is nonlinear. No claim of conserved combined energy, Lorentz invariance,
no-signaling, microscopic causality, or a physical quantum/classical interface is
made. Those are separate unresolved obligations.

The periodic source has nonzero mean. Its zero Fourier mode is driven: the mean
field may drift even with damping. That is a property of the defined model,
not evidence of self-stabilization. Remove the source mean only as a separately
documented change to the equation.

## 8. Measurements

\[
p_a=\sum_m\rho_{am,am},\quad
r=\sum_a\rho_{a1,a1},\quad
\rho^W_{ab}=\sum_m\rho_{am,bm}.
\]

- Total probability: \(\operatorname{Tr}\rho\).
- Global purity: \(\operatorname{Tr}(\rho^2)\).
- World purity: \(\operatorname{Tr}[(\rho^W)^2]\).
- World coherence: \(C=(N-1)^{-1}\sum_{a\ne b}|\rho^W_{ab}|\).
- Record probability: \(r=P(m=1)\), not a measure of emotional attachment.
- Classical world-record mutual information: calculated from the diagonal
  joint distribution in the selected basis; not quantum mutual information.
- Exterior mass: sum above the preset group boundary; a narrative boundary only
  in experiment 02, a fixed bookkeeping partition in the other experiments.
- Field energy diagnostic:
  \(\frac{\Delta x}{2}\sum_j[v_j^2+c_*^2((\phi_{j+1}-\phi_j)/\Delta x)^2]\).
  This excludes source interaction energy and is not the total hybrid energy.
- Ablation distance: total variation of endpoint world probabilities,
  \(\tfrac12\sum_a|p_a-q_a|\).

The coherence metric is a standard finite-state off-diagonal measure. It is
**not** the EFMW-EXP-001 residual recurrence, and no EXP-001 performance numbers
are used to validate these experiments.
