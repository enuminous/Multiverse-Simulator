import Mathlib

namespace Quantum
open Matrix Finset
open scoped ComplexOrder

variable {ι κ : Type*} [Fintype ι] [DecidableEq ι] [Fintype κ]

def Density (ρ : Matrix ι ι ℂ) : Prop := ρ.PosSemidef ∧ ρ.trace = 1

noncomputable def channel (K : κ → Matrix ι ι ℂ) (ρ : Matrix ι ι ℂ) : Matrix ι ι ℂ :=
  ∑ a, K a * ρ * (K a)ᴴ

theorem channel_positive (K : κ → Matrix ι ι ℂ) (ρ : Matrix ι ι ℂ)
    (hρ : ρ.PosSemidef) : (channel K ρ).PosSemidef := by
  exact Matrix.posSemidef_sum univ (fun a _ => hρ.mul_mul_conjTranspose_same (K a))

theorem channel_trace (K : κ → Matrix ι ι ℂ)
    (hK : ∑ a, (K a)ᴴ * K a = 1) (ρ : Matrix ι ι ℂ) :
    (channel K ρ).trace = ρ.trace := by
  unfold channel
  rw [trace_sum]
  calc
    (∑ a, trace (K a * ρ * (K a)ᴴ)) = ∑ a, trace ((K a)ᴴ * K a * ρ) := by
      apply sum_congr rfl
      intro a _
      exact trace_mul_cycle _ _ _
    _ = trace ((∑ a, (K a)ᴴ * K a) * ρ) := by rw [sum_mul, trace_sum]
    _ = trace ρ := by rw [hK, one_mul]

theorem channel_density (K : κ → Matrix ι ι ℂ)
    (hK : ∑ a, (K a)ᴴ * K a = 1) (ρ : Matrix ι ι ℂ) (hρ : Density ρ) :
    Density (channel K ρ) :=
  ⟨channel_positive K ρ hρ.1, (channel_trace K hK ρ).trans hρ.2⟩

theorem unitary_step_density (U ρ : Matrix ι ι ℂ)
    (hU : Uᴴ * U = 1) (hρ : Density ρ) : Density (U * ρ * Uᴴ) := by
  refine ⟨hρ.1.mul_mul_conjTranspose_same U, ?_⟩
  rw [trace_mul_cycle, hU, one_mul]
  exact hρ.2

/-- Projector dephasing with its completeness condition made explicit. -/
noncomputable def dephase (q : ℝ) (P : κ → Matrix ι ι ℂ) (ρ : Matrix ι ι ℂ) : Matrix ι ι ℂ :=
  q • ρ + (1-q) • channel P ρ

theorem dephase_density (q : ℝ) (hq : q ∈ Set.Icc 0 1)
    (P : κ → Matrix ι ι ℂ) (hP : ∑ a, (P a)ᴴ * P a = 1)
    (ρ : Matrix ι ι ℂ) (hρ : Density ρ) : Density (dephase q P ρ) := by
  refine ⟨(hρ.1.smul hq.1).add ((channel_positive P ρ hρ.1).smul (sub_nonneg.mpr hq.2)), ?_⟩
  unfold dephase
  rw [trace_add, trace_smul, trace_smul, channel_trace P hP, ← add_smul]
  simpa using hρ.2

theorem damping_weight (γ τ : ℝ) (hγ : 0 ≤ γ) (hτ : 0 ≤ τ) :
    Real.exp (-γ*τ) ∈ Set.Icc 0 1 := by
  exact ⟨(Real.exp_pos _).le, Real.exp_le_one_iff.mpr (by nlinarith)⟩

/-- Any finite composition of density-preserving steps preserves density. -/
theorem repeated_density (T : Matrix ι ι ℂ → Matrix ι ι ℂ)
    (hT : ∀ ρ, Density ρ → Density (T ρ)) (ρ : Matrix ι ι ℂ)
    (hρ : Density ρ) (n : ℕ) : Density ((T^[n]) ρ) := by
  induction n with
  | zero => simpa using hρ
  | succ n ih => simpa [Function.iterate_succ_apply'] using hT _ ih

end Quantum
