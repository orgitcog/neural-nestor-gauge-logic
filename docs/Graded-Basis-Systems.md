# Generalized Graded Basis Systems

## Overview

This document describes the generalization from **Cayley-Dickson algebras** (binary-only) to **arbitrary radix-based graded algebras** with multi-index structure. This extension preserves orthogonality information and provides a richer framework than collapsing to layer coefficient patterns alone.

## Motivation

The Cayley-Dickson construction (Real → Complex → Quaternion → Octonion → Sedenion) uses binary indexing with layer patterns from Pascal's triangle:

- Complex (2D): `1–1`
- Quaternion (4D): `1–2–1`
- Octonion (8D): `1–3–3–1`
- Sedenion (16D): `1–4–6–4–1`

These patterns come from the binomial expansion `(1+z)^k`, where basis elements are indexed by **bitstrings of length k** and graded by **Hamming weight** (number of 1s).

### The Key Insight

The layer coefficient pattern (e.g., `1–4–6–4–1`) is **not** the algebra itself—it's a **projection** of richer geometric structure. The actual basis is:

- Indexed by multi-indices (product sets like `(ℤ₂)^k`)
- Each basis element is a distinct orthonormal axis
- Grading by digit-sum preserves structural information
- Multiplication uses group structure or twists

By generalizing to arbitrary radix systems, we can:

1. Use **prime-power bases** like trinary (p=3) or quinary (p=5)
2. Create **mixed-radix systems** (tensor products)
3. Match problem domains with appropriate symmetries
4. Go beyond division algebras (which only exist in dimensions 1, 2, 4, 8)

## Mathematical Foundation

### Prime-Power Radix Systems

For a prime (or prime power) radix `p` and length `k`:

- **Basis**: Elements indexed by `(ℤ_p)^k` (k-tuples with digits 0 to p-1)
- **Dimension**: `p^k`
- **Grading**: `grade(a) = a₁ + a₂ + ... + aₖ` (digit sum)
- **Layer coefficients**: From polynomial `P_p(z)^k` where `P_p(z) = 1 + z + z² + ... + z^(p-1)`

**Examples:**

| System | p | k | Dimension | Polynomial | Layer Pattern |
|--------|---|---|-----------|------------|---------------|
| Complex | 2 | 1 | 2 | (1+z) | 1–1 |
| Quaternion | 2 | 2 | 4 | (1+z)² | 1–2–1 |
| Trionion | 3 | 1 | 3 | (1+z+z²) | 1–1–1 |
| Nonion | 3 | 2 | 9 | (1+z+z²)² | 1–2–3–2–1 |
| Pentonion | 5 | 1 | 5 | (1+z+...+z⁴) | 1–1–1–1–1 |

### Mixed-Radix Systems

Tensor products of different radices:

- **Basis**: `(ℤ_{p₁})^{k₁} × (ℤ_{p₂})^{k₂} × ...`
- **Dimension**: `p₁^{k₁} · p₂^{k₂} · ...`
- **Grading**: Sum across all components
- **Layer coefficients**: Product of individual polynomials

**Examples:**

| System | Structure | Dimension | Polynomial | Layer Pattern |
|--------|-----------|-----------|------------|---------------|
| Hexenion | ℤ₂ × ℤ₃ | 6 | (1+z)(1+z+z²) | 1–2–2–1 |
| Icosonion | ℤ₂² × ℤ₅ | 20 | (1+z)²(1+z+...+z⁴) | 1–3–4–4–4–3–1 |
| Custom | ℤ₂ × ℤ₃ × ℤ₅ | 30 | (1+z)(1+z+z²)(1+z+...+z⁴) | 1–3–5–6–6–5–3–1 |

## Multiplication Rules

Unlike Cayley-Dickson's rigid structure, we can choose from multiple multiplication rules:

### 1. Group Algebra (Commutative)

```
e_a · e_b = e_{a+b (mod p)}
```

- **Simple and structured**
- Natural for systems indexed by groups
- Full of zero divisors (not division-like)
- **Example**: In ℤ₃, e₁ · e₂ = e₀ (since 1+2=0 mod 3)

### 2. Twisted Group Algebra

```
e_a · e_b = ω(a,b) · e_{a+b}
```

where `ω(a,b)` is a cocycle (sign or phase factor).

- **Generalizes Cayley-Dickson**
- Can enforce specific algebraic properties
- For binary with `ω(a,b) = (-1)^{a·b}`: recovers quaternion/octonion structure
- For odd p: can use p-th roots of unity

**Example (Cayley-Dickson twist)**:
```
For binary indices a, b:
ω(a,b) = (-1)^{a·b} where a·b is inner product
```

### 3. Matrix Representation

Represent basis elements as orthogonal/unitary matrices (generalized Pauli/Weyl operators).

- **Most practical for computation**
- Preserves all orthogonality information
- Matrix multiplication = algebra multiplication
- Inner product = Hilbert-Schmidt inner product

**Example**: Generalized Pauli operators σ_{a,b} for qubits (a,b ∈ ℤ₂^n)

## Implementation

### Core Data Types

```typescript
interface MultiIndex {
  structure: RadixComponent[];  // [(radix, length), ...]
  digits: number[];              // Actual digit values
  grade: number;                 // Sum of digits
}

interface RadixComponent {
  radix: number;   // The base (e.g., 2, 3, 5)
  length: number;  // How many digits
}

interface GradedBasis {
  name: string;
  dimension: number;
  structure: RadixComponent[];
  basisIndices: MultiIndex[];
  layerCoefficients: number[];
  maxGrade: number;
  multiplicationRule: MultiplicationRule;
}
```

### Creating Systems

```typescript
// Single radix: (ℤ_p)^k
const trionion = createRadixSystem('Trionion', 3, 1);
const nonion = createRadixSystem('Nonion', 3, 2);

// Mixed radix
const hexenion = createMixedRadixSystem('Hexenion', [
  { radix: 2, length: 1 },
  { radix: 3, length: 1 }
]);

// From catalog
const octonion = createFromCatalog('Octonion');
```

### Multi-Index Operations

```typescript
// Create index
const idx = createMultiIndex([1, 2, 0], structure);

// Grading (automatic)
idx.grade // = 1 + 2 + 0 = 3

// Addition (for group algebra)
const sum = addMultiIndices(idx1, idx2);

// Inner product (for twisted algebra)
const ip = innerProduct(idx1, idx2);
```

## Examples and Interpretations

### Trinary Systems (p=3)

**Trionion (3D)**:
- Basis: e₀=(0), e₁=(1), e₂=(2)
- Each at different grade: 0, 1, 2
- Layer pattern: 1–1–1 (uniform)
- Natural for systems with 3-fold symmetry

**Nonion (9D)**:
- Basis: (ℤ₃)² with 9 elements
- Layer pattern: 1–2–3–2–1 from (1+z+z²)²
- Grade 2 has most elements: (0,2), (1,1), (2,0)
- Symmetric grading structure

### Quinary and Higher Primes

**Pentonion (5D)**:
- Basis: e₀, e₁, e₂, e₃, e₄
- Layer pattern: 1–1–1–1–1 (one per grade)
- Natural for 5-fold symmetry

**Septonion (7D)**:
- **Not** the same as Octonion (8D)!
- 7 distinct orthogonal axes
- Different symmetry structure

### Mixed-Radix Systems

**Hexenion (6D)**: ℤ₂ × ℤ₃
- Basis: (bit, trit) pairs
- Dimension: 2 × 3 = 6
- Polynomial: (1+z)(1+z+z²) = 1 + 2z + 2z² + z³
- Grade = bit + trit

**Icosonion (20D)**: ℤ₂² × ℤ₅
- Basis: (bit₁, bit₂, quint) triples
- Dimension: 4 × 5 = 20
- **Not** the same as icosian calculus (which is 4D quaternionic)
- Polynomial: (1+z)²(1+z+z²+z³+z⁴) = 1 + 3z + 4z² + 4z³ + 4z⁴ + 3z⁵ + z⁶

## Why Preserve Multi-Index Structure?

### 1. Orthogonality

Each basis element is a **distinct orthonormal axis**:

```
⟨e_a, e_b⟩ = δ_{a,b}
```

Example: In Nonion, (0,1) and (1,0) are different elements, not collapsed despite both having grade 1.

### 2. Factorization Structure

Multi-indices remember their origin:

- (a₁, a₂) from ℤ₃² preserves the factorization
- Can project onto individual components
- Can separate/combine subsystems

### 3. Explicit Group Structure

Multiplication is well-defined on indices:

```
Group algebra: e_(1,2) · e_(2,1) = e_(0,0) in ℤ₃²
```

### 4. Information Loss in Collapse

The layer pattern alone loses information:

- Nonion: Pattern 1–2–3–2–1 has 9 numbers collapsed to 5
- Can't recover which specific elements exist at each grade
- Can't distinguish different systems with same pattern

## Comparison: Cayley-Dickson vs Generalized

| Aspect | Cayley-Dickson | Generalized Graded Basis |
|--------|----------------|--------------------------|
| **Radix** | Binary (p=2) only | Any prime power |
| **Dimension** | Powers of 2 | Any p^k or product |
| **Structure** | Division algebras (up to 8D) | Flexible algebras |
| **Multiplication** | Fixed (XOR + sign) | Multiple options |
| **Symmetry** | Binary symmetry | Match problem domain |
| **Layer pattern** | Binomial coefficients | General polynomials |

## Applications

### 1. Systems with Natural Radix

- **Trinary**: Three-state logic, ternary computing
- **Quinary**: Five-element models (5-fold symmetry)
- **Septonary**: Seven-element structures

### 2. Tensor Products

- **Mixed radix**: Natural for heterogeneous systems
- **Factorizable structure**: Quantum tensor products
- **Hybrid systems**: Different symmetries combined

### 3. Beyond Division Algebras

- **No constraint to 1, 2, 4, 8 dimensions**
- Can have zero divisors (like sedenions)
- More freedom in algebraic properties
- Match specific problem requirements

### 4. Quantum Computing

- **Qudits** (d-dimensional quantum systems) instead of qubits
- Generalized Pauli operators for ℤ_d
- Mixed-radix quantum systems

### 5. Coding Theory

- **Error-correcting codes** over ℤ_p
- Reed-Solomon codes (prime fields)
- Algebraic geometry codes

## Catalog of Systems

See `GRADED_BASIS_CATALOG` for complete list:

| Name | Dimension | Layer Pattern | Description |
|------|-----------|---------------|-------------|
| Real | 1 | 1 | Real numbers |
| Complex | 2 | 1–1 | Binary k=1 |
| Quaternion | 4 | 1–2–1 | Binary k=2 |
| Octonion | 8 | 1–3–3–1 | Binary k=3 |
| Sedenion | 16 | 1–4–6–4–1 | Binary k=4 |
| Trionion | 3 | 1–1–1 | Trinary k=1 |
| Nonion | 9 | 1–2–3–2–1 | Trinary k=2 |
| Pentonion | 5 | 1–1–1–1–1 | Quinary k=1 |
| Septonion | 7 | 1–1–1–1–1–1–1 | Septonary k=1 |
| Hexenion | 6 | 1–2–2–1 | ℤ₂ × ℤ₃ |
| Icosonion | 20 | 1–3–4–4–4–3–1 | ℤ₂² × ℤ₅ |

## Usage Example

```typescript
import {
  createRadixSystem,
  createMixedRadixSystem,
  formatLayerCoefficients,
  getBasisElementsAtGrade,
  addMultiIndices,
} from './graded-basis';

// Create a trinary system
const nonion = createRadixSystem('Nonion', 3, 2);

console.log(`Dimension: ${nonion.dimension}`);
console.log(`Layer pattern: ${formatLayerCoefficients(nonion.layerCoefficients)}`);

// Get basis elements at grade 2
const grade2 = getBasisElementsAtGrade(nonion, 2);
console.log(`Grade 2 elements: ${grade2.length}`);

// Group algebra multiplication
const e1 = nonion.basisIndices[1];
const e2 = nonion.basisIndices[2];
const product = addMultiIndices(e1, e2);
console.log(`e${e1.digits} · e${e2.digits} = e${product.digits}`);
```

## Testing

Run the test suite:

```bash
npm run test:graded-basis
```

Or via tsx:

```bash
npx tsx scripts/test-graded-basis.ts
```

The test suite validates:
- Prime-power systems (trinary, quinary, etc.)
- Mixed-radix systems
- Polynomial layer coefficient calculation
- Multi-index operations
- Multiplication rules
- Integration with examples

## Future Extensions

1. **Tensor operations**: Extend einsum to graded basis tensors
2. **Matrix representations**: Implement generalized Pauli/Weyl operators
3. **Twisted algebras**: Full implementation of cocycles
4. **Visualization**: Display grading structure and basis elements
5. **Integration**: Connect with existing hypercomplex tensor logic

## References

- **Cayley-Dickson construction**: Binary special case
- **Group algebras**: General framework for indexed bases
- **Clifford algebras**: Twisted algebras with quadratic forms
- **Quantum computing**: Generalized Pauli operators
- **Coding theory**: Algebraic codes over finite fields

## Conclusion

Generalized graded basis systems extend beyond Cayley-Dickson by:

1. **Preserving structure**: Multi-index not collapsed to coefficients
2. **Flexible radix**: Any prime power or mixed system
3. **Multiple multiplication rules**: Match problem requirements
4. **Beyond division algebras**: More representational freedom

This provides the **true generalization** requested: keep the basis indexed by product sets, grade by weight/digit-sum, and don't collapse to just binomial coefficients.
