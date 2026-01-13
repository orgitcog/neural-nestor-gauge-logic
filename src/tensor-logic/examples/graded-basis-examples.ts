/**
 * EXAMPLES: GENERALIZED GRADED BASIS ALGEBRAS
 * 
 * Demonstrates the extension from Cayley-Dickson (binary) to arbitrary
 * radix-based graded algebras.
 */

import {
  createRadixSystem,
  createMixedRadixSystem,
  formatLayerCoefficients,
  getBasisElementsAtGrade,
  multiIndexToString,
  addMultiIndices,
  computeTwist,
  MultiplicationRule,
  GRADED_BASIS_CATALOG,
  type GradedBasis,
} from '../graded-basis.js';

/**
 * Display a graded basis system
 */
function displayGradedBasis(basis: GradedBasis): void {
  console.log(`\n${basis.name} (${basis.dimension}D)`);
  console.log('─'.repeat(60));
  console.log(`Structure: ${basis.structure.map(c => `ℤ_${c.radix}${c.length > 1 ? `^${c.length}` : ''}`).join(' × ')}`);
  console.log(`Layer pattern: ${formatLayerCoefficients(basis.layerCoefficients)}`);
  console.log(`Max grade: ${basis.maxGrade}`);
  console.log(`Multiplication rule: ${basis.multiplicationRule}`);
  
  // Show basis elements organized by grade
  console.log('\nBasis elements by grade:');
  for (let grade = 0; grade <= Math.min(basis.maxGrade, 10); grade++) {
    const elements = getBasisElementsAtGrade(basis, grade);
    if (elements.length > 0) {
      const elemStr = elements.slice(0, 10).map(e => multiIndexToString(e)).join(', ');
      const more = elements.length > 10 ? `, ... (${elements.length} total)` : '';
      console.log(`  Grade ${grade} [${elements.length} elements]: ${elemStr}${more}`);
    }
  }
  
  if (basis.maxGrade > 10) {
    console.log(`  ... (grades 11-${basis.maxGrade} omitted)`);
  }
}

/**
 * Example 1: Trinary Systems (p=3)
 * 
 * These correspond to basis indexed by (ℤ₃)^k
 * Layer pattern from (1 + z + z²)^k
 */
export function exampleTrinarySystems(): void {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              EXAMPLE 1: TRINARY SYSTEMS (p=3)               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  console.log('\nTrinary systems use base-3 digits (0, 1, 2).');
  console.log('Generating polynomial: P₃(z) = 1 + z + z²');
  
  // Trionion: 3D (k=1)
  const trionion = createRadixSystem('Trionion', 3, 1);
  displayGradedBasis(trionion);
  
  console.log('\nInterpretation:');
  console.log('  - 3 dimensions: e₀=(0), e₁=(1), e₂=(2)');
  console.log('  - Each at different grade: 0, 1, 2');
  console.log('  - Layer pattern 1–1–1 shows uniform distribution');
  
  // Nonion: 9D (k=2)
  const nonion = createRadixSystem('Nonion', 3, 2);
  displayGradedBasis(nonion);
  
  console.log('\nInterpretation:');
  console.log('  - 9 dimensions from (ℤ₃)²');
  console.log('  - Layer pattern 1–2–3–2–1 from (1+z+z²)²');
  console.log('  - Symmetric grading structure');
  console.log('  - Grade 2 has most elements (3): (0,2), (1,1), (2,0)');
  
  // Show multiplication example (group algebra)
  console.log('\nGroup algebra multiplication (mod 3):');
  if (nonion.basisIndices.length >= 4) {
    const e1 = nonion.basisIndices[1]; // (0,1)
    const e2 = nonion.basisIndices[3]; // (1,0)
    const product = addMultiIndices(e1, e2);
    console.log(`  e${multiIndexToString(e1)} · e${multiIndexToString(e2)} = e${multiIndexToString(product)}`);
    console.log(`  Grades: ${e1.grade} + ${e2.grade} = ${product.grade}`);
  }
}

/**
 * Example 2: Quinary and Septonary Systems
 * 
 * Higher prime radices
 */
export function exampleHigherPrimes(): void {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║         EXAMPLE 2: QUINARY (p=5) & SEPTONARY (p=7)         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  // Pentonion: 5D
  const pentonion = createRadixSystem('Pentonion', 5, 1);
  displayGradedBasis(pentonion);
  
  console.log('\nInterpretation:');
  console.log('  - 5 dimensions with digits 0–4');
  console.log('  - Layer pattern 1–1–1–1–1: one element per grade');
  console.log('  - Natural for systems with 5-fold symmetry');
  
  // Septonion: 7D
  const septonion = createRadixSystem('Septonion', 7, 1);
  displayGradedBasis(septonion);
  
  console.log('\nInterpretation:');
  console.log('  - 7 dimensions with digits 0–6');
  console.log('  - Note: Different from Octonion (8D, binary)!');
  console.log('  - Preserves all 7 orthogonal axes as distinct');
}

/**
 * Example 3: Mixed Radix Systems
 * 
 * Tensor products of different radices
 */
export function exampleMixedRadix(): void {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║             EXAMPLE 3: MIXED RADIX SYSTEMS                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  console.log('\nMixed radix = tensor product of different prime powers');
  console.log('Dimension multiplies, generating polynomials multiply.');
  
  // Hexenion: 2×3 = 6D
  console.log('\n--- Hexenion: ℤ₂ × ℤ₃ ---');
  const hexenion = createMixedRadixSystem(
    'Hexenion',
    [{ radix: 2, length: 1 }, { radix: 3, length: 1 }]
  );
  displayGradedBasis(hexenion);
  
  console.log('\nPolynomial: (1+z)(1+z+z²) = 1 + 2z + 2z² + z³');
  console.log('Interpretation:');
  console.log('  - Basis: (bit, trit) pairs');
  console.log('  - Example: (0,0), (0,1), (0,2), (1,0), (1,1), (1,2)');
  console.log('  - Grade = bit + trit');
  
  // Icosonion: 4×5 = 20D
  console.log('\n--- Icosonion: ℤ₂² × ℤ₅ ---');
  const icosonion = createMixedRadixSystem(
    'Icosonion',
    [{ radix: 2, length: 2 }, { radix: 5, length: 1 }]
  );
  displayGradedBasis(icosonion);
  
  console.log('\nPolynomial: (1+z)²(1+z+z²+z³+z⁴)');
  console.log('Interpretation:');
  console.log('  - Basis: (bit₁, bit₂, quint) triples');
  console.log('  - Dimension 20, not to be confused with icosian calculus');
  console.log('  - Icosian calculus is 4D quaternionic, this is 20D graded');
  
  // Custom mixed system
  console.log('\n--- Custom: ℤ₂ × ℤ₃ × ℤ₅ ---');
  const custom = createMixedRadixSystem(
    'Custom-2-3-5',
    [
      { radix: 2, length: 1 },
      { radix: 3, length: 1 },
      { radix: 5, length: 1 },
    ]
  );
  displayGradedBasis(custom);
  
  console.log('\nDimension: 2×3×5 = 30');
  console.log('Polynomial: (1+z)(1+z+z²)(1+z+z²+z³+z⁴)');
}

/**
 * Example 4: Comparison with Cayley-Dickson
 * 
 * Show how binary case relates to traditional hypercomplex numbers
 */
export function exampleCayleyDicksonComparison(): void {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        EXAMPLE 4: CAYLEY-DICKSON AS SPECIAL CASE           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  console.log('\nCayley-Dickson construction is the binary case (p=2):');
  console.log('Polynomial: (1+z)^k gives binomial coefficients\n');
  
  const systems = [
    { name: 'Real', k: 0, traditional: 'ℝ (1D)' },
    { name: 'Complex', k: 1, traditional: 'ℂ (2D)' },
    { name: 'Quaternion', k: 2, traditional: 'ℍ (4D)' },
    { name: 'Octonion', k: 3, traditional: '𝕆 (8D)' },
    { name: 'Sedenion', k: 4, traditional: '𝕊 (16D)' },
  ];
  
  console.log('k | Dimension | Layer Pattern    | Traditional Name');
  console.log('--|-----------|------------------|------------------');
  
  for (const sys of systems) {
    if (sys.k === 0) {
      console.log(`${sys.k} | 1         | 1                | ${sys.traditional}`);
    } else {
      const basis = createRadixSystem(sys.name, 2, sys.k);
      const pattern = formatLayerCoefficients(basis.layerCoefficients);
      const dim = basis.dimension.toString().padEnd(9);
      console.log(`${sys.k} | ${dim} | ${pattern.padEnd(16)} | ${sys.traditional}`);
    }
  }
  
  console.log('\nKey insight:');
  console.log('  - Binary gives Pascal\'s triangle coefficients');
  console.log('  - Each basis element is a bitstring of length k');
  console.log('  - Grade = Hamming weight (number of 1s)');
  console.log('  - Multiplication uses XOR + sign rule (twisted group algebra)');
}

/**
 * Example 5: Multiplication Rules
 * 
 * Show different ways to define multiplication
 */
export function exampleMultiplicationRules(): void {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           EXAMPLE 5: MULTIPLICATION RULES                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  console.log('\nThree main approaches to multiplication:\n');
  
  // 1. Group algebra
  console.log('1. GROUP ALGEBRA (Commutative convolution)');
  console.log('   e_a · e_b = e_{a+b (mod p)}');
  console.log('   - Simple and structured');
  console.log('   - Full of zero divisors (not division-like)');
  console.log('   - Matches indexing perfectly');
  
  const trionionGA = createRadixSystem('Trionion', 3, 1, MultiplicationRule.GroupAlgebra);
  console.log(`\n   Example: ${trionionGA.name} with group algebra`);
  if (trionionGA.basisIndices.length >= 3) {
    const e1 = trionionGA.basisIndices[1]; // (1)
    const e2 = trionionGA.basisIndices[2]; // (2)
    const sum = addMultiIndices(e1, e2);
    console.log(`   e${multiIndexToString(e1)} · e${multiIndexToString(e2)} = e${multiIndexToString(sum)}`);
    console.log(`   (1·1 = 1 in this algebra)`);
  }
  
  // 2. Twisted group algebra
  console.log('\n2. TWISTED GROUP ALGEBRA (Add phase/sign)');
  console.log('   e_a · e_b = ω(a,b) · e_{a+b}');
  console.log('   where ω is a cocycle (±1 or p-th root of unity)');
  console.log('   - Generalizes Cayley-Dickson construction');
  console.log('   - Can enforce certain algebraic properties');
  console.log('   - Used for Clifford algebras, Weyl operators');
  
  const quaternionTwisted = createRadixSystem('Quaternion', 2, 2, MultiplicationRule.TwistedGroupAlgebra);
  console.log(`\n   Example: ${quaternionTwisted.name} with twisted algebra`);
  if (quaternionTwisted.basisIndices.length >= 4) {
    const e1 = quaternionTwisted.basisIndices[1]; // (0,1)
    const e2 = quaternionTwisted.basisIndices[2]; // (1,0)
    const sum = addMultiIndices(e1, e2);
    const twist = computeTwist(e1, e2, MultiplicationRule.TwistedGroupAlgebra);
    console.log(`   e${multiIndexToString(e1)} · e${multiIndexToString(e2)} = ${twist >= 0 ? '' : '-'}e${multiIndexToString(sum)}`);
  }
  
  // 3. Matrix representation
  console.log('\n3. MATRIX REPRESENTATION');
  console.log('   Represent basis elements as orthogonal/unitary matrices');
  console.log('   (e.g., generalized Pauli/Weyl operators)');
  console.log('   - Most practical for computation');
  console.log('   - Preserves all orthogonality information');
  console.log('   - Matrix multiplication = algebra multiplication');
  console.log('   - Inner product = Hilbert-Schmidt inner product');
  
  console.log('\n   Example: Pauli matrices for ℤ₂ (qubits)');
  console.log('   X = [[0,1],[1,0]], Z = [[1,0],[0,-1]]');
  console.log('   Generalized Pauli: σ_{a,b} for a,b ∈ ℤ₂^n');
}

/**
 * Example 6: Grading Preservation
 * 
 * Show why grading matters for preserving structure
 */
export function exampleGradingPreservation(): void {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          EXAMPLE 6: WHY PRESERVE GRADING?                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  console.log('\nThe layer coefficient pattern is NOT the full story!');
  console.log('It\'s a projection of richer geometric structure.\n');
  
  const nonion = createRadixSystem('Nonion', 3, 2);
  
  console.log('Example: Nonion (9D) has layer pattern 1–2–3–2–1');
  console.log('But the actual basis is:');
  console.log('');
  console.log('Grade | Elements                  | Count | Interpretation');
  console.log('------|---------------------------|-------|------------------');
  for (let grade = 0; grade <= nonion.maxGrade; grade++) {
    const elements = getBasisElementsAtGrade(nonion, grade);
    const elemStr = elements.map(e => multiIndexToString(e)).join(', ');
    const count = elements.length;
    let interp = '';
    if (grade === 0) interp = 'Identity/scalar';
    else if (grade === nonion.maxGrade) interp = 'Max weight';
    else if (grade === Math.floor(nonion.maxGrade / 2)) interp = 'Most elements';
    
    console.log(`${grade}     | ${elemStr.padEnd(25)} | ${count}     | ${interp}`);
  }
  
  console.log('\nWhy this matters:');
  console.log('  1. ORTHOGONALITY: Each basis element is a distinct axis');
  console.log('     - (0,1) and (1,0) are different, not collapsed');
  console.log('     - Inner product: ⟨e_a, e_b⟩ = δ_{a,b}');
  console.log('');
  console.log('  2. STRUCTURE: Multi-index preserves factorization');
  console.log('     - (a₁,a₂) remembers it came from ℤ₃²');
  console.log('     - Can separate/project onto components');
  console.log('');
  console.log('  3. MULTIPLICATION: Group structure is explicit');
  console.log('     - e_(1,2) · e_(2,1) = e_(0,0) in group algebra');
  console.log('     - Grading helps track properties');
  console.log('');
  console.log('Compare to collapsing: layer pattern loses this information!');
}

/**
 * Run all graded basis examples
 */
export function runAllGradedBasisExamples(): void {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                                                              ║');
  console.log('║         GENERALIZED GRADED BASIS ALGEBRAS                   ║');
  console.log('║    Beyond Cayley-Dickson: Prime-Power & Mixed Systems      ║');
  console.log('║                                                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  console.log('\nTheory: Instead of just binary (p=2) doubling,');
  console.log('use any prime power (p^k) or mixed radix system.');
  console.log('');
  console.log('Generating polynomial for (ℤ_p)^k:');
  console.log('  P_p(z)^k where P_p(z) = 1 + z + z² + ... + z^{p-1}');
  console.log('');
  console.log('Key: Preserve MULTI-INDEX structure, not just coefficients!');
  
  exampleTrinarySystems();
  exampleHigherPrimes();
  exampleMixedRadix();
  exampleCayleyDicksonComparison();
  exampleMultiplicationRules();
  exampleGradingPreservation();
  
  // Show catalog
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    SYSTEM CATALOG                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  console.log('Name          | Dim | Layer Pattern      | Description');
  console.log('--------------|-----|-------------------|------------------------');
  for (const sys of GRADED_BASIS_CATALOG) {
    const name = sys.name.padEnd(13);
    const dim = sys.dimension.toString().padEnd(3);
    const pattern = sys.layerPattern.padEnd(17);
    console.log(`${name} | ${dim} | ${pattern} | ${sys.description}`);
  }
  
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('CONCLUSION');
  console.log('══════════════════════════════════════════════════════════════\n');
  console.log('Generalized graded basis algebras provide:');
  console.log('');
  console.log('1. UNIFIED FRAMEWORK: Binary, trinary, mixed, etc.');
  console.log('   - Cayley-Dickson is just p=2 special case');
  console.log('   - Natural extensions to any prime power');
  console.log('');
  console.log('2. PRESERVED STRUCTURE: Multi-index not collapsed');
  console.log('   - Each basis element remains distinct');
  console.log('   - Orthogonality explicitly maintained');
  console.log('   - Factorization structure visible');
  console.log('');
  console.log('3. FLEXIBLE MULTIPLICATION: Multiple options');
  console.log('   - Group algebra: simple, structured');
  console.log('   - Twisted: can enforce properties');
  console.log('   - Matrix: computational, faithful');
  console.log('');
  console.log('4. BEYOND DIVISION ALGEBRAS: More freedom');
  console.log('   - Don\'t need normed division property');
  console.log('   - Can have different symmetries');
  console.log('   - Match problem domain better');
  console.log('');
  console.log('This is the TRUE generalization requested:');
  console.log('Keep the basis indexed by product sets,');
  console.log('grade by weight/digit-sum,');
  console.log('don\'t collapse to just binomial coefficients!');
  console.log('══════════════════════════════════════════════════════════════\n');
}
