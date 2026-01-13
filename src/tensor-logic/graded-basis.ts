/**
 * GENERALIZED GRADED BASIS ALGEBRAS
 * 
 * This module implements a generalization beyond Cayley-Dickson construction
 * to support arbitrary radix-based graded algebras with multi-index structure.
 * 
 * Key concepts:
 * 1. **Prime-power digit systems**: Basis indexed by (ℤ_p)^k
 * 2. **Mixed-radix systems**: Tensor products of different radices
 * 3. **Grading by digit-sum**: Preserving orthogonality information
 * 4. **Multiple multiplication rules**: Group algebra, twisted, matrix models
 * 
 * References:
 * - Cayley-Dickson construction (binary case: p=2)
 * - Generalized Clifford algebras
 * - Group algebras and twisted group algebras
 * - Weyl operators and generalized Pauli matrices
 */

/**
 * Multi-index for basis elements
 * Represents a vector in (ℤ_{p₁})^{k₁} × (ℤ_{p₂})^{k₂} × ...
 */
export interface MultiIndex {
  /** The radix components: [(radix, length), ...] */
  structure: RadixComponent[];
  
  /** The actual digit values */
  digits: number[];
  
  /** Cached grade (sum of all digits) */
  grade: number;
}

/**
 * A single radix component in a mixed-radix system
 */
export interface RadixComponent {
  /** The radix (base), typically prime */
  radix: number;
  
  /** How many digits of this radix */
  length: number;
}

/**
 * A graded basis algebra with multi-index structure
 */
export interface GradedBasis {
  /** Name of the algebra */
  name: string;
  
  /** Dimension (total number of basis elements) */
  dimension: number;
  
  /** The radix structure */
  structure: RadixComponent[];
  
  /** All basis element indices */
  basisIndices: MultiIndex[];
  
  /** Layer coefficients (how many elements per grade) */
  layerCoefficients: number[];
  
  /** Maximum grade */
  maxGrade: number;
  
  /** Multiplication rule type */
  multiplicationRule: MultiplicationRule;
}

/**
 * Types of multiplication rules
 */
export enum MultiplicationRule {
  /** Group algebra: e_a · e_b = e_{a+b} (commutative) */
  GroupAlgebra = 'GroupAlgebra',
  
  /** Twisted group algebra: e_a · e_b = ω(a,b) e_{a+b} with phase/sign */
  TwistedGroupAlgebra = 'TwistedGroupAlgebra',
  
  /** Matrix representation (generalized Pauli/Weyl operators) */
  MatrixRepresentation = 'MatrixRepresentation',
  
  /** Cayley-Dickson (special case of twisted for binary) */
  CayleyDickson = 'CayleyDickson',
}

/**
 * Create a multi-index from digit array and structure
 */
export function createMultiIndex(
  digits: number[],
  structure: RadixComponent[]
): MultiIndex {
  // Validate digits match structure
  let expectedLength = 0;
  for (const comp of structure) {
    expectedLength += comp.length;
  }
  
  if (digits.length !== expectedLength) {
    throw new Error(`Digit length ${digits.length} doesn't match structure length ${expectedLength}`);
  }
  
  // Validate each digit is within its radix
  let pos = 0;
  for (const comp of structure) {
    for (let i = 0; i < comp.length; i++) {
      const digit = digits[pos + i];
      if (digit < 0 || digit >= comp.radix) {
        throw new Error(`Digit ${digit} out of range for radix ${comp.radix}`);
      }
    }
    pos += comp.length;
  }
  
  // Calculate grade (sum of all digits)
  const grade = digits.reduce((sum, d) => sum + d, 0);
  
  return { structure, digits, grade };
}

/**
 * Create a single-radix system (ℤ_p)^k
 * Examples:
 * - Binary (p=2): Real→Complex→Quaternion→Octonion
 * - Trinary (p=3): Trionion (k=1), Nonion (k=2)
 * - Quinary (p=5): Pentonion (k=1)
 */
export function createRadixSystem(
  name: string,
  radix: number,
  power: number,
  multiplicationRule: MultiplicationRule = MultiplicationRule.GroupAlgebra
): GradedBasis {
  const structure: RadixComponent[] = [{ radix, length: power }];
  const dimension = Math.pow(radix, power);
  
  // Generate all basis indices
  const basisIndices: MultiIndex[] = [];
  generateIndices([], structure, basisIndices);
  
  // Calculate layer coefficients (coefficient of z^r in (1+z+...+z^{p-1})^k)
  const maxGrade = (radix - 1) * power;
  const layerCoefficients = calculateLayerCoefficients(structure);
  
  return {
    name,
    dimension,
    structure,
    basisIndices,
    layerCoefficients,
    maxGrade,
    multiplicationRule,
  };
}

/**
 * Create a mixed-radix system (tensor product of different radices)
 * Example: Hexenion = (ℤ_2) × (ℤ_3) has dimension 6
 */
export function createMixedRadixSystem(
  name: string,
  components: RadixComponent[],
  multiplicationRule: MultiplicationRule = MultiplicationRule.GroupAlgebra
): GradedBasis {
  // Calculate dimension
  let dimension = 1;
  for (const comp of components) {
    dimension *= Math.pow(comp.radix, comp.length);
  }
  
  // Generate all basis indices
  const basisIndices: MultiIndex[] = [];
  generateIndices([], components, basisIndices);
  
  // Calculate max grade and layer coefficients
  let maxGrade = 0;
  for (const comp of components) {
    maxGrade += (comp.radix - 1) * comp.length;
  }
  
  const layerCoefficients = calculateLayerCoefficients(components);
  
  return {
    name,
    dimension,
    structure: components,
    basisIndices,
    layerCoefficients,
    maxGrade,
    multiplicationRule,
  };
}

/**
 * Recursively generate all multi-indices for a given structure
 */
function generateIndices(
  current: number[],
  remainingStructure: RadixComponent[],
  result: MultiIndex[],
  fullStructure?: RadixComponent[]
): void {
  // Store the original full structure on first call
  if (fullStructure === undefined) {
    fullStructure = remainingStructure;
  }
  
  if (remainingStructure.length === 0) {
    // Base case: we've filled all positions
    const index = createMultiIndex(current, fullStructure);
    result.push(index);
    return;
  }
  
  // Take first component
  const [first, ...rest] = remainingStructure;
  
  // Generate all combinations for this component
  function recurse(pos: number, digits: number[]): void {
    if (pos === first.length) {
      // Move to next component
      generateIndices([...current, ...digits], rest, result, fullStructure);
      return;
    }
    
    // Try all values for this digit
    for (let d = 0; d < first.radix; d++) {
      recurse(pos + 1, [...digits, d]);
    }
  }
  
  recurse(0, []);
}

/**
 * Calculate layer coefficients using polynomial expansion
 * 
 * For structure [(p₁, k₁), (p₂, k₂), ...], the generating function is:
 * ∏ᵢ (1 + z + z² + ... + z^{pᵢ-1})^{kᵢ}
 * 
 * Returns coefficients [c₀, c₁, c₂, ..., c_max] where cᵣ is the number
 * of basis elements with grade r.
 */
export function calculateLayerCoefficients(structure: RadixComponent[]): number[] {
  // Start with polynomial [1] (constant 1)
  let poly: number[] = [1];
  
  for (const comp of structure) {
    // For this component, we need (1 + z + ... + z^{p-1})^k
    const basePoly = createRadixPolynomial(comp.radix);
    
    // Raise to power k
    let componentPoly = [1];
    for (let i = 0; i < comp.length; i++) {
      componentPoly = multiplyPolynomials(componentPoly, basePoly);
    }
    
    // Multiply with accumulated polynomial
    poly = multiplyPolynomials(poly, componentPoly);
  }
  
  return poly;
}

/**
 * Create polynomial 1 + z + z² + ... + z^{p-1}
 * Represented as coefficient array [1, 1, 1, ..., 1] with p terms
 */
function createRadixPolynomial(radix: number): number[] {
  return Array(radix).fill(1);
}

/**
 * Multiply two polynomials
 */
function multiplyPolynomials(a: number[], b: number[]): number[] {
  if (a.length === 0 || b.length === 0) return [];
  
  const result = new Array(a.length + b.length - 1).fill(0);
  
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] += a[i] * b[j];
    }
  }
  
  return result;
}

/**
 * Get basis elements at a specific grade level
 */
export function getBasisElementsAtGrade(
  basis: GradedBasis,
  grade: number
): MultiIndex[] {
  return basis.basisIndices.filter(idx => idx.grade === grade);
}

/**
 * Format layer coefficients as a string (e.g., "1-2-3-2-1")
 */
export function formatLayerCoefficients(coeffs: number[]): string {
  return coeffs.join('–');
}

/**
 * Convert multi-index to string representation
 */
export function multiIndexToString(idx: MultiIndex): string {
  return `(${idx.digits.join(',')})`;
}

/**
 * Check if two multi-indices are equal
 */
export function multiIndexEqual(a: MultiIndex, b: MultiIndex): boolean {
  if (a.digits.length !== b.digits.length) return false;
  return a.digits.every((d, i) => d === b.digits[i]);
}

/**
 * Add two multi-indices (modulo their radices)
 * This is used for group algebra multiplication: e_a · e_b = e_{a+b}
 */
export function addMultiIndices(a: MultiIndex, b: MultiIndex): MultiIndex {
  if (a.digits.length !== b.digits.length) {
    throw new Error('Cannot add multi-indices of different lengths');
  }
  
  const result: number[] = [];
  let pos = 0;
  
  for (let compIdx = 0; compIdx < a.structure.length; compIdx++) {
    const comp = a.structure[compIdx];
    for (let i = 0; i < comp.length; i++) {
      result.push((a.digits[pos] + b.digits[pos]) % comp.radix);
      pos++;
    }
  }
  
  return createMultiIndex(result, a.structure);
}

/**
 * Inner product of two multi-indices (used for twisted group algebra)
 * Computes a · b = ∑ᵢ aᵢbᵢ (used to determine phase/sign)
 */
export function innerProduct(a: MultiIndex, b: MultiIndex): number {
  if (a.digits.length !== b.digits.length) {
    throw new Error('Cannot compute inner product of different lengths');
  }
  
  let sum = 0;
  for (let i = 0; i < a.digits.length; i++) {
    sum += a.digits[i] * b.digits[i];
  }
  return sum;
}

/**
 * Compute sign/phase for twisted group algebra
 * For binary (Cayley-Dickson): ω(a,b) = (-1)^{a·b}
 * For general p: can use p-th roots of unity
 */
export function computeTwist(
  a: MultiIndex,
  b: MultiIndex,
  rule: MultiplicationRule
): number {
  if (rule === MultiplicationRule.GroupAlgebra) {
    return 1; // No twist
  }
  
  if (rule === MultiplicationRule.CayleyDickson) {
    // Binary case: (-1)^{a·b}
    const prod = innerProduct(a, b);
    return prod % 2 === 0 ? 1 : -1;
  }
  
  if (rule === MultiplicationRule.TwistedGroupAlgebra) {
    // General case: could use roots of unity
    // For simplicity, use same as Cayley-Dickson for now
    const prod = innerProduct(a, b);
    return prod % 2 === 0 ? 1 : -1;
  }
  
  return 1;
}

/**
 * Description of well-known graded basis systems
 */
export interface SystemDescription {
  name: string;
  dimension: number;
  layerPattern: string;
  description: string;
  structure: RadixComponent[];
}

/**
 * Catalog of interesting graded basis systems
 */
export const GRADED_BASIS_CATALOG: SystemDescription[] = [
  // Binary systems (Cayley-Dickson)
  {
    name: 'Real',
    dimension: 1,
    layerPattern: '1',
    description: 'Real numbers (1D)',
    structure: [{ radix: 2, length: 0 }],
  },
  {
    name: 'Complex',
    dimension: 2,
    layerPattern: '1–1',
    description: 'Complex numbers (binary k=1)',
    structure: [{ radix: 2, length: 1 }],
  },
  {
    name: 'Quaternion',
    dimension: 4,
    layerPattern: '1–2–1',
    description: 'Quaternions (binary k=2)',
    structure: [{ radix: 2, length: 2 }],
  },
  {
    name: 'Octonion',
    dimension: 8,
    layerPattern: '1–3–3–1',
    description: 'Octonions (binary k=3)',
    structure: [{ radix: 2, length: 3 }],
  },
  {
    name: 'Sedenion',
    dimension: 16,
    layerPattern: '1–4–6–4–1',
    description: 'Sedenions (binary k=4)',
    structure: [{ radix: 2, length: 4 }],
  },
  
  // Trinary systems
  {
    name: 'Trionion',
    dimension: 3,
    layerPattern: '1–1–1',
    description: 'Trinary system (p=3, k=1)',
    structure: [{ radix: 3, length: 1 }],
  },
  {
    name: 'Nonion',
    dimension: 9,
    layerPattern: '1–2–3–2–1',
    description: 'Trinary system (p=3, k=2)',
    structure: [{ radix: 3, length: 2 }],
  },
  
  // Quinary and septonary
  {
    name: 'Pentonion',
    dimension: 5,
    layerPattern: '1–1–1–1–1',
    description: 'Quinary system (p=5, k=1)',
    structure: [{ radix: 5, length: 1 }],
  },
  {
    name: 'Septonion',
    dimension: 7,
    layerPattern: '1–1–1–1–1–1–1',
    description: 'Septonary system (p=7, k=1)',
    structure: [{ radix: 7, length: 1 }],
  },
  
  // Mixed radix systems
  {
    name: 'Hexenion',
    dimension: 6,
    layerPattern: '1–2–2–1',
    description: 'Mixed (ℤ₂ × ℤ₃)',
    structure: [{ radix: 2, length: 1 }, { radix: 3, length: 1 }],
  },
  {
    name: 'Icosonion',
    dimension: 20,
    layerPattern: '1–3–4–4–4–3–1',
    description: 'Mixed (ℤ₂² × ℤ₅) = (1+z)²(1+z+z²+z³+z⁴)',
    structure: [{ radix: 2, length: 2 }, { radix: 5, length: 1 }],
  },
];

/**
 * Look up a system description by name
 */
export function getSystemDescription(name: string): SystemDescription | undefined {
  return GRADED_BASIS_CATALOG.find(s => s.name === name);
}

/**
 * Create a graded basis from a catalog entry
 */
export function createFromCatalog(
  name: string,
  multiplicationRule: MultiplicationRule = MultiplicationRule.GroupAlgebra
): GradedBasis | undefined {
  const desc = getSystemDescription(name);
  if (!desc) return undefined;
  
  if (desc.structure.length === 1) {
    return createRadixSystem(name, desc.structure[0].radix, desc.structure[0].length, multiplicationRule);
  } else {
    return createMixedRadixSystem(name, desc.structure, multiplicationRule);
  }
}
