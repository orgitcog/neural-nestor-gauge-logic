#!/usr/bin/env tsx

/**
 * Test suite for Generalized Graded Basis Algebras
 * 
 * Tests:
 * 1. Prime-power radix systems (trinary, quinary, etc.)
 * 2. Mixed-radix systems (tensor products)
 * 3. Layer coefficient generation (polynomial expansion)
 * 4. Multi-index operations (addition, grading)
 * 5. Multiplication rules (group algebra, twisted)
 * 6. Integration with examples
 */

import {
  createRadixSystem,
  createMixedRadixSystem,
  createFromCatalog,
  calculateLayerCoefficients,
  formatLayerCoefficients,
  getBasisElementsAtGrade,
  multiIndexToString,
  addMultiIndices,
  innerProduct,
  computeTwist,
  createMultiIndex,
  MultiplicationRule,
  GRADED_BASIS_CATALOG,
  type RadixComponent,
} from '../src/tensor-logic/graded-basis.js';

import {
  runAllGradedBasisExamples,
} from '../src/tensor-logic/examples/graded-basis-examples.js';

// ============================================================================
// TEST UTILITIES
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
    testsPassed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${message}`);
    testsFailed++;
  }
}

function assertClose(a: number, b: number, message: string, epsilon = 1e-6): void {
  assert(Math.abs(a - b) < epsilon, `${message} (${a.toFixed(6)} ≈ ${b.toFixed(6)})`);
}

function testSection(name: string): void {
  console.log(`\n${colors.blue}${name}${colors.reset}`);
  console.log('─'.repeat(60));
}

// ============================================================================
// TEST 1: TRINARY SYSTEMS
// ============================================================================

function testTrinarySystems(): void {
  testSection('TEST 1: Trinary Systems (p=3)');

  // Trionion: 3D, k=1
  const trionion = createRadixSystem('Trionion', 3, 1);
  assert(trionion.dimension === 3, 'Trionion has 3 dimensions');
  assert(trionion.structure.length === 1, 'Trionion has single radix component');
  assert(trionion.structure[0].radix === 3, 'Trionion radix is 3');
  assert(trionion.maxGrade === 2, 'Trionion max grade is 2');
  
  // Layer pattern: 1-1-1
  const trionionPattern = formatLayerCoefficients(trionion.layerCoefficients);
  assert(trionionPattern === '1–1–1', `Trionion pattern is 1–1–1 (got ${trionionPattern})`);
  
  // Check basis elements
  assert(trionion.basisIndices.length === 3, 'Trionion has 3 basis elements');
  assert(trionion.basisIndices[0].digits[0] === 0, 'First element is (0)');
  assert(trionion.basisIndices[1].digits[0] === 1, 'Second element is (1)');
  assert(trionion.basisIndices[2].digits[0] === 2, 'Third element is (2)');

  // Nonion: 9D, k=2
  const nonion = createRadixSystem('Nonion', 3, 2);
  assert(nonion.dimension === 9, 'Nonion has 9 dimensions');
  assert(nonion.maxGrade === 4, 'Nonion max grade is 4');
  
  // Layer pattern: 1-2-3-2-1 from (1+z+z²)²
  const nonionPattern = formatLayerCoefficients(nonion.layerCoefficients);
  assert(nonionPattern === '1–2–3–2–1', `Nonion pattern is 1–2–3–2–1 (got ${nonionPattern})`);
  
  // Check distribution by grade
  const grade0 = getBasisElementsAtGrade(nonion, 0);
  const grade2 = getBasisElementsAtGrade(nonion, 2);
  const grade4 = getBasisElementsAtGrade(nonion, 4);
  
  assert(grade0.length === 1, 'Nonion grade 0 has 1 element');
  assert(grade2.length === 3, 'Nonion grade 2 has 3 elements (most)');
  assert(grade4.length === 1, 'Nonion grade 4 has 1 element');
  
  // Test symmetry
  const grade1 = getBasisElementsAtGrade(nonion, 1);
  const grade3 = getBasisElementsAtGrade(nonion, 3);
  assert(grade1.length === grade3.length, 'Nonion pattern is symmetric');
}

// ============================================================================
// TEST 2: QUINARY AND SEPTONARY SYSTEMS
// ============================================================================

function testHigherPrimeSystems(): void {
  testSection('TEST 2: Quinary (p=5) and Septonary (p=7) Systems');

  // Pentonion: 5D
  const pentonion = createRadixSystem('Pentonion', 5, 1);
  assert(pentonion.dimension === 5, 'Pentonion has 5 dimensions');
  assert(pentonion.maxGrade === 4, 'Pentonion max grade is 4');
  
  const pentonionPattern = formatLayerCoefficients(pentonion.layerCoefficients);
  assert(pentonionPattern === '1–1–1–1–1', `Pentonion pattern is 1–1–1–1–1 (got ${pentonionPattern})`);
  
  // Each grade has exactly one element
  for (let grade = 0; grade <= 4; grade++) {
    const elements = getBasisElementsAtGrade(pentonion, grade);
    assert(elements.length === 1, `Pentonion grade ${grade} has 1 element`);
  }

  // Septonion: 7D
  const septonion = createRadixSystem('Septonion', 7, 1);
  assert(septonion.dimension === 7, 'Septonion has 7 dimensions');
  assert(septonion.maxGrade === 6, 'Septonion max grade is 6');
  
  const septonionPattern = formatLayerCoefficients(septonion.layerCoefficients);
  assert(septonionPattern === '1–1–1–1–1–1–1', `Septonion pattern is 1–1–1–1–1–1–1 (got ${septonionPattern})`);
}

// ============================================================================
// TEST 3: MIXED RADIX SYSTEMS
// ============================================================================

function testMixedRadixSystems(): void {
  testSection('TEST 3: Mixed Radix Systems');

  // Hexenion: ℤ₂ × ℤ₃ = 6D
  const hexenion = createMixedRadixSystem(
    'Hexenion',
    [{ radix: 2, length: 1 }, { radix: 3, length: 1 }]
  );
  
  assert(hexenion.dimension === 6, 'Hexenion has 6 dimensions (2×3)');
  assert(hexenion.structure.length === 2, 'Hexenion has 2 radix components');
  
  // Pattern: (1+z)(1+z+z²) = 1 + 2z + 2z² + z³
  const hexenionPattern = formatLayerCoefficients(hexenion.layerCoefficients);
  assert(hexenionPattern === '1–2–2–1', `Hexenion pattern is 1–2–2–1 (got ${hexenionPattern})`);
  
  // Check specific basis elements
  assert(hexenion.basisIndices.length === 6, 'Hexenion has 6 basis elements');
  // (0,0), (0,1), (0,2), (1,0), (1,1), (1,2)
  const firstElem = hexenion.basisIndices[0];
  assert(firstElem.digits.length === 2, 'Hexenion elements have 2 digits');
  assert(firstElem.digits[0] === 0 && firstElem.digits[1] === 0, 'First element is (0,0)');

  // Icosonion: ℤ₂² × ℤ₅ = 20D
  const icosonion = createMixedRadixSystem(
    'Icosonion',
    [{ radix: 2, length: 2 }, { radix: 5, length: 1 }]
  );
  
  assert(icosonion.dimension === 20, 'Icosonion has 20 dimensions (4×5)');
  assert(icosonion.maxGrade === 6, 'Icosonion max grade is 6 (2+4)');
  
  // Pattern: (1+z)²(1+z+z²+z³+z⁴) = 1 + 3z + 4z² + 4z³ + 4z⁴ + 3z⁵ + z⁶
  const icosonionPattern = formatLayerCoefficients(icosonion.layerCoefficients);
  console.log(`  Icosonion pattern: ${icosonionPattern}`);
  assert(icosonionPattern === '1–3–4–4–4–3–1', `Icosonion pattern is 1–3–4–4–4–3–1 (got ${icosonionPattern})`);
  
  // Grades 2, 3, 4 should each have 4 elements (maximum)
  const grade2 = getBasisElementsAtGrade(icosonion, 2);
  const grade3 = getBasisElementsAtGrade(icosonion, 3);
  const grade4 = getBasisElementsAtGrade(icosonion, 4);
  assert(grade2.length === 4, `Icosonion grade 2 has 4 elements (got ${grade2.length})`);
  assert(grade3.length === 4, `Icosonion grade 3 has 4 elements (got ${grade3.length})`);
  assert(grade4.length === 4, `Icosonion grade 4 has 4 elements (got ${grade4.length})`);
}

// ============================================================================
// TEST 4: POLYNOMIAL LAYER COEFFICIENTS
// ============================================================================

function testLayerCoefficientCalculation(): void {
  testSection('TEST 4: Layer Coefficient Polynomial Calculation');

  // Test binary (Cayley-Dickson)
  // (1+z)² = 1 + 2z + z²
  const binaryK2: RadixComponent[] = [{ radix: 2, length: 2 }];
  const coeffsQuaternion = calculateLayerCoefficients(binaryK2);
  assert(coeffsQuaternion.length === 3, 'Quaternion has 3 layer coefficients');
  assert(coeffsQuaternion[0] === 1, 'Quaternion: 1 element at grade 0');
  assert(coeffsQuaternion[1] === 2, 'Quaternion: 2 elements at grade 1');
  assert(coeffsQuaternion[2] === 1, 'Quaternion: 1 element at grade 2');

  // Test (1+z)⁴ = 1 + 4z + 6z² + 4z³ + z⁴ (Sedenion)
  const binaryK4: RadixComponent[] = [{ radix: 2, length: 4 }];
  const coeffsSedenion = calculateLayerCoefficients(binaryK4);
  assert(coeffsSedenion[0] === 1, 'Sedenion: 1 element at grade 0');
  assert(coeffsSedenion[1] === 4, 'Sedenion: 4 elements at grade 1');
  assert(coeffsSedenion[2] === 6, 'Sedenion: 6 elements at grade 2');
  assert(coeffsSedenion[3] === 4, 'Sedenion: 4 elements at grade 3');
  assert(coeffsSedenion[4] === 1, 'Sedenion: 1 element at grade 4');

  // Test trinary: (1+z+z²)² = 1 + 2z + 3z² + 2z³ + z⁴
  const trinaryK2: RadixComponent[] = [{ radix: 3, length: 2 }];
  const coeffsNonion = calculateLayerCoefficients(trinaryK2);
  assert(coeffsNonion[0] === 1, 'Nonion: coefficient 0 is 1');
  assert(coeffsNonion[1] === 2, 'Nonion: coefficient 1 is 2');
  assert(coeffsNonion[2] === 3, 'Nonion: coefficient 2 is 3');
  assert(coeffsNonion[3] === 2, 'Nonion: coefficient 3 is 2');
  assert(coeffsNonion[4] === 1, 'Nonion: coefficient 4 is 1');

  // Test mixed: (1+z)(1+z+z²) = 1 + 2z + 2z² + z³
  const mixed23: RadixComponent[] = [
    { radix: 2, length: 1 },
    { radix: 3, length: 1 }
  ];
  const coeffsHexenion = calculateLayerCoefficients(mixed23);
  assert(coeffsHexenion[0] === 1, 'Hexenion: coefficient 0 is 1');
  assert(coeffsHexenion[1] === 2, 'Hexenion: coefficient 1 is 2');
  assert(coeffsHexenion[2] === 2, 'Hexenion: coefficient 2 is 2');
  assert(coeffsHexenion[3] === 1, 'Hexenion: coefficient 3 is 1');
}

// ============================================================================
// TEST 5: MULTI-INDEX OPERATIONS
// ============================================================================

function testMultiIndexOperations(): void {
  testSection('TEST 5: Multi-Index Operations');

  // Create test indices
  const struct: RadixComponent[] = [{ radix: 3, length: 2 }];
  const idx1 = createMultiIndex([1, 2], struct);
  const idx2 = createMultiIndex([2, 1], struct);

  // Test grading
  assert(idx1.grade === 3, 'Grade of (1,2) is 3');
  assert(idx2.grade === 3, 'Grade of (2,1) is 3');

  // Test addition (mod 3)
  const sum = addMultiIndices(idx1, idx2);
  assert(sum.digits[0] === 0, 'Addition mod 3: (1+2) mod 3 = 0');
  assert(sum.digits[1] === 0, 'Addition mod 3: (2+1) mod 3 = 0');
  assert(sum.grade === 0, 'Sum has grade 0');

  // Test inner product
  const ip = innerProduct(idx1, idx2);
  assert(ip === 4, 'Inner product: 1×2 + 2×1 = 4');

  // Test with binary indices
  const binaryStruct: RadixComponent[] = [{ radix: 2, length: 3 }];
  const b1 = createMultiIndex([1, 0, 1], binaryStruct);
  const b2 = createMultiIndex([0, 1, 1], binaryStruct);
  
  const binarySum = addMultiIndices(b1, b2);
  assert(binarySum.digits[0] === 1, 'Binary addition: 1+0 = 1');
  assert(binarySum.digits[1] === 1, 'Binary addition: 0+1 = 1');
  assert(binarySum.digits[2] === 0, 'Binary addition mod 2: 1+1 = 0');
  
  const binaryIP = innerProduct(b1, b2);
  assert(binaryIP === 1, 'Binary inner product: 1×0 + 0×1 + 1×1 = 1');
}

// ============================================================================
// TEST 6: MULTIPLICATION RULES
// ============================================================================

function testMultiplicationRules(): void {
  testSection('TEST 6: Multiplication Rules');

  // Test group algebra
  const gaSystem = createRadixSystem('Test-GA', 3, 2, MultiplicationRule.GroupAlgebra);
  assert(gaSystem.multiplicationRule === MultiplicationRule.GroupAlgebra, 'Group algebra rule set');

  // Test twisted group algebra
  const twistedSystem = createRadixSystem('Test-Twisted', 2, 2, MultiplicationRule.TwistedGroupAlgebra);
  assert(twistedSystem.multiplicationRule === MultiplicationRule.TwistedGroupAlgebra, 'Twisted algebra rule set');

  // Test twist computation for binary (Cayley-Dickson)
  const struct: RadixComponent[] = [{ radix: 2, length: 2 }];
  const idx1 = createMultiIndex([1, 0], struct);
  const idx2 = createMultiIndex([0, 1], struct);
  
  const twist1 = computeTwist(idx1, idx2, MultiplicationRule.TwistedGroupAlgebra);
  assert(twist1 === 1, 'Twist for orthogonal indices is 1');
  
  const idx3 = createMultiIndex([1, 1], struct);
  const twist2 = computeTwist(idx1, idx3, MultiplicationRule.TwistedGroupAlgebra);
  // Inner product: 1×1 + 0×1 = 1 (odd) => twist = -1
  assert(twist2 === -1, 'Twist for non-orthogonal indices can be -1');
}

// ============================================================================
// TEST 7: CATALOG AND FACTORY
// ============================================================================

function testCatalogAndFactory(): void {
  testSection('TEST 7: System Catalog and Factory Methods');

  // Check catalog size
  assert(GRADED_BASIS_CATALOG.length >= 11, `Catalog has ${GRADED_BASIS_CATALOG.length} entries`);

  // Test creating from catalog
  const complex = createFromCatalog('Complex');
  assert(complex !== undefined, 'Complex created from catalog');
  assert(complex?.dimension === 2, 'Complex from catalog has correct dimension');

  const quaternion = createFromCatalog('Quaternion');
  assert(quaternion?.dimension === 4, 'Quaternion from catalog has correct dimension');
  
  const trionion = createFromCatalog('Trionion');
  assert(trionion?.dimension === 3, 'Trionion from catalog has correct dimension');

  const hexenion = createFromCatalog('Hexenion');
  assert(hexenion?.dimension === 6, 'Hexenion from catalog has correct dimension');

  const icosonion = createFromCatalog('Icosonion');
  assert(icosonion?.dimension === 20, 'Icosonion from catalog has correct dimension');
  
  // Test invalid name
  const invalid = createFromCatalog('NonExistent');
  assert(invalid === undefined, 'Non-existent system returns undefined');
}

// ============================================================================
// TEST 8: COMPARISON WITH CAYLEY-DICKSON
// ============================================================================

function testCayleyDicksonComparison(): void {
  testSection('TEST 8: Cayley-Dickson as Special Case');

  // All binary systems should match traditional dimensions
  const testCases = [
    { k: 1, dim: 2, name: 'Complex' },
    { k: 2, dim: 4, name: 'Quaternion' },
    { k: 3, dim: 8, name: 'Octonion' },
    { k: 4, dim: 16, name: 'Sedenion' },
  ];

  for (const tc of testCases) {
    const sys = createRadixSystem(tc.name, 2, tc.k);
    assert(sys.dimension === tc.dim, `${tc.name}: 2^${tc.k} = ${tc.dim}`);
    
    // Check max grade
    assert(sys.maxGrade === tc.k, `${tc.name}: max grade = ${tc.k}`);
    
    // Check symmetry of layer coefficients
    const coeffs = sys.layerCoefficients;
    const isSymmetric = coeffs.every((c, i) => c === coeffs[coeffs.length - 1 - i]);
    assert(isSymmetric, `${tc.name}: layer coefficients are symmetric`);
  }
}

// ============================================================================
// TEST 9: RUN EXAMPLES
// ============================================================================

function testExamples(): void {
  testSection('TEST 9: Graded Basis Examples');

  console.log('\nRunning all graded basis examples...\n');
  
  try {
    runAllGradedBasisExamples();
    assert(true, 'All examples executed successfully');
  } catch (error) {
    assert(false, `Examples failed with error: ${error}`);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function main() {
  console.log('╔' + '═'.repeat(60) + '╗');
  console.log('║' + ' '.repeat(8) + 'GRADED BASIS ALGEBRAS TEST SUITE' + ' '.repeat(18) + '║');
  console.log('╚' + '═'.repeat(60) + '╝\n');

  testTrinarySystems();
  testHigherPrimeSystems();
  testMixedRadixSystems();
  testLayerCoefficientCalculation();
  testMultiIndexOperations();
  testMultiplicationRules();
  testCatalogAndFactory();
  testCayleyDicksonComparison();
  testExamples();

  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  console.log(`Total: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}✓ All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}✗ Some tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch(console.error);
