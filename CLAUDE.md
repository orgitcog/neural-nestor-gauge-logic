# CLAUDE.md

This file provides guidance for Claude Code when working with this repository.

## Project Overview

This is the **Neural Nestor Gauge Logic** framework - an extension of Pedro Domingos' Tensor Logic that unifies neural and symbolic AI. The project includes formal verification using Lean 4.

## Lean4 Testing and Verification

### Prerequisites

- Lean 4 and Lake (Lean's build system) must be installed
- See https://leanprover.github.io/lean4/doc/setup.html for installation

### Building and Testing Lean4 Code

```bash
# Navigate to the Lean directory
cd lean

# Build the project (this also type-checks all proofs)
lake build

# Run the executable (if testing Main.lean)
lake exe neural-nestor-gauge-logic
```

### What Lake Build Verifies

Running `lake build` in the `lean/` directory will:

1. **Type-check all definitions** - Ensures all structures (Tensor, Nestor, FiberBundle, etc.) are well-formed
2. **Verify all proofs** - Confirms theorems like `morphism_left_identity`, `morphism_right_identity`, `morphism_associativity`, and `neural_nestor_morph_is_category` are valid
3. **Check axiom consistency** - Validates that axioms like `tensor_indices_match_shape` and `gauge_invariance` are properly declared

### Key Lean Files

| File | Description |
|------|-------------|
| `lean/lakefile.lean` | Lake build configuration |
| `lean/Main.lean` | Entry point for executable |
| `lean/NeuralNestorGaugeLogic.lean` | Main library export |
| `lean/NeuralNestorGaugeLogic/Basic.lean` | Core definitions and proofs |

### Verified Theorems

The Lean formalization proves:

- **Category laws**: Identity and associativity of morphism composition
- **Type safety**: Operations preserve type signatures
- **Functor properties**: Structure-preserving mappings between Nestor categories

### Troubleshooting

If `lake build` fails:

1. Ensure you're in the `lean/` directory
2. Run `lake clean` then `lake build` to rebuild from scratch
3. Check Lean 4 version compatibility with `lean --version`

## TypeScript Tests

For the TypeScript/Deno components:

```bash
# Run neural nestor tests
deno test scripts/test-neural-nestor.ts

# Run scroll tests
deno test scripts/test-scroll.ts
```

## Common Commands

```bash
# Full verification (Lean + TypeScript)
cd lean && lake build && cd .. && deno test scripts/test-neural-nestor.ts
```
