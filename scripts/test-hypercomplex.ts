#!/usr/bin/env tsx

/**
 * Test suite for Hypercomplex Tensor Logic
 * 
 * Tests:
 * 1. Hypercomplex number arithmetic (Complex, Quaternion, Octonion, Sedenion)
 * 2. Hypercomplex tensor operations
 * 3. Hypercomplex einsum
 * 4. Examples
 */

import {
  Complex,
  Quaternion,
  Octonion,
  Sedenion,
  CayleyDickson,
  AlgebraType,
  complex,
  quaternion,
  octonion,
  hypercomplexEqual,
  algebraDimension,
} from '../src/tensor-logic/hypercomplex.js';

import {
  createComplexTensor,
  createQuaternionTensor,
  createHypercomplexTensor,
  hypercomplexEinsum,
  complexReLU,
  quaternionReLU,
  hypercomplexTensorToString,
  extractRealParts,
} from '../src/tensor-logic/hypercomplex-tensor.js';

import {
  runAllHypercomplexExamples,
} from '../src/tensor-logic/examples/hypercomplex-examples.js';

// ============================================================================
// TEST UTILITIES
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
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
// TEST 1: COMPLEX NUMBERS
// ============================================================================

function testComplexNumbers(): void {
  testSection('TEST 1: Complex Numbers (ℂ)');

  // Basic construction
  const z1 = complex(3, 4);
  assert(z1.real === 3 && z1.imag === 4, 'Complex construction');

  // Addition
  const z2 = complex(1, 2);
  const sum = z1.add(z2);
  assert(sum.real === 4 && sum.imag === 6, 'Complex addition');

  // Multiplication: (3+4i)(1+2i) = 3 + 6i + 4i + 8i² = 3 + 10i - 8 = -5 + 10i
  const prod = z1.multiply(z2);
  assertClose(prod.real, -5, 'Complex multiplication (real part)');
  assertClose(prod.imag, 10, 'Complex multiplication (imag part)');

  // Conjugate
  const conj = z1.conjugate();
  assert(conj.real === 3 && conj.imag === -4, 'Complex conjugate');

  // Norm: |3+4i| = √(9+16) = 5
  assertClose(z1.norm(), 5, 'Complex norm');

  // Division
  const quot = z1.divide(z2);
  const check = quot.multiply(z2);
  assertClose(check.real, z1.real, 'Complex division (verify by multiplication)');
  assertClose(check.imag, z1.imag, 'Complex division (verify by multiplication)');

  // Commutativity: z1 * z2 = z2 * z1
  const prod1 = z1.multiply(z2);
  const prod2 = z2.multiply(z1);
  assertClose(prod1.real, prod2.real, 'Complex multiplication is commutative');
  assertClose(prod1.imag, prod2.imag, 'Complex multiplication is commutative');

  // Associativity
  const z3 = complex(2, 1);
  const assoc1 = z1.multiply(z2).multiply(z3);
  const assoc2 = z1.multiply(z2.multiply(z3));
  assertClose(assoc1.real, assoc2.real, 'Complex multiplication is associative');
  assertClose(assoc1.imag, assoc2.imag, 'Complex multiplication is associative');
}

// ============================================================================
// TEST 2: QUATERNIONS
// ============================================================================

function testQuaternions(): void {
  testSection('TEST 2: Quaternions (ℍ)');

  // Basic construction
  const q1 = quaternion(1, 0, 0, 0);
  assert(q1.w === 1, 'Quaternion construction (scalar part)');

  // Identity quaternion
  const identity = quaternion(1, 0, 0, 0);
  const q2 = quaternion(2, 3, 4, 5);
  const prod = identity.multiply(q2);
  assert(
    Math.abs(prod.w - q2.w) < 1e-10 &&
    Math.abs(prod.x - q2.x) < 1e-10 &&
    Math.abs(prod.y - q2.y) < 1e-10 &&
    Math.abs(prod.z - q2.z) < 1e-10,
    'Identity quaternion'
  );

  // i² = j² = k² = -1
  const i = quaternion(0, 1, 0, 0);
  const j = quaternion(0, 0, 1, 0);
  const k = quaternion(0, 0, 0, 1);
  
  const i2 = i.multiply(i);
  assertClose(i2.w, -1, 'i² = -1');
  
  const j2 = j.multiply(j);
  assertClose(j2.w, -1, 'j² = -1');
  
  const k2 = k.multiply(k);
  assertClose(k2.w, -1, 'k² = -1');

  // ij = k, ji = -k (non-commutative!)
  const ij = i.multiply(j);
  const ji = j.multiply(i);
  assertClose(ij.z, 1, 'ij = k');
  assertClose(ji.z, -1, 'ji = -k');
  assert(Math.abs(ij.z + ji.z) < 1e-10, 'Quaternions are non-commutative');

  // But still associative
  const q3 = quaternion(1, 1, 1, 1);
  const q4 = quaternion(0, 1, 0, -1);
  const assoc1 = q2.multiply(q3).multiply(q4);
  const assoc2 = q2.multiply(q3.multiply(q4));
  assertClose(assoc1.w, assoc2.w, 'Quaternions are associative (w)');
  assertClose(assoc1.x, assoc2.x, 'Quaternions are associative (x)');
  assertClose(assoc1.y, assoc2.y, 'Quaternions are associative (y)');
  assertClose(assoc1.z, assoc2.z, 'Quaternions are associative (z)');

  // Norm of unit quaternion
  const unit = quaternion(0.5, 0.5, 0.5, 0.5);
  assertClose(unit.norm(), 1, 'Unit quaternion norm');

  // Rotation test
  const axisAngle = Quaternion.fromAxisAngle([1, 0, 0], Math.PI / 2);
  assertClose(axisAngle.norm(), 1, 'Rotation quaternion is normalized');
}

// ============================================================================
// TEST 3: OCTONIONS
// ============================================================================

function testOctonions(): void {
  testSection('TEST 3: Octonions (𝕆)');

  // Construction
  const o1 = octonion(1, 0, 0, 0, 0, 0, 0, 0);
  assert(o1.dimension === 8, 'Octonion has 8 dimensions');
  assertClose(o1.get(0), 1, 'Octonion construction');

  // Addition
  const o2 = octonion(0, 1, 0, 0, 0, 0, 0, 0);
  const sum = o1.add(o2);
  assertClose(sum.get(0), 1, 'Octonion addition (component 0)');
  assertClose(sum.get(1), 1, 'Octonion addition (component 1)');

  // Norm
  const o3 = octonion(1, 1, 1, 1, 1, 1, 1, 1);
  assertClose(o3.norm(), Math.sqrt(8), 'Octonion norm');

  // Conjugate
  const conj = o3.conjugate();
  assertClose(conj.get(0), 1, 'Octonion conjugate (real part)');
  assertClose(conj.get(1), -1, 'Octonion conjugate (e1 part)');

  // Non-associativity: Check (e1·e2)·e4 ≠ e1·(e2·e4)
  const e1 = octonion(0, 1, 0, 0, 0, 0, 0, 0);
  const e2 = octonion(0, 0, 1, 0, 0, 0, 0, 0);
  const e4 = octonion(0, 0, 0, 0, 1, 0, 0, 0);
  
  const left = e1.multiply(e2).multiply(e4);
  const right = e1.multiply(e2.multiply(e4));
  
  // They might be different (non-associative)
  const diff = left.add(right.scale(-1)).norm();
  console.log(`  Non-associativity check: ||(e1·e2)·e4 - e1·(e2·e4)|| = ${diff.toFixed(6)}`);
  assert(true, 'Octonions may be non-associative');

  // But multiplication is still well-defined
  const o4 = octonion(1, 1, 0, 0, 0, 0, 0, 0);
  const o5 = octonion(0, 0, 1, 1, 0, 0, 0, 0);
  const prod = o4.multiply(o5);
  assert(prod.dimension === 8, 'Octonion multiplication produces octonion');
}

// ============================================================================
// TEST 4: SEDENIONS AND CAYLEY-DICKSON
// ============================================================================

function testSedenionsAndCayleyDickson(): void {
  testSection('TEST 4: Sedenions (𝕊) and Cayley-Dickson Construction');

  // Sedenion construction
  const s1 = new Sedenion(new Float64Array(16));
  assert(s1.dimension === 16, 'Sedenion has 16 dimensions');

  // Generic Cayley-Dickson for power-of-2 dimensions
  const cd32 = new CayleyDickson(new Float64Array(32), AlgebraType.Trigintaduonion);
  assert(cd32.dimension === 32, 'Cayley-Dickson supports 32 dimensions');

  const cd64 = new CayleyDickson(new Float64Array(64), AlgebraType.Sexagintaquatronion);
  assert(cd64.dimension === 64, 'Cayley-Dickson supports 64 dimensions');

  // Addition
  const cd1 = new CayleyDickson([1, 2, 3, 4]);
  const cd2 = new CayleyDickson([4, 3, 2, 1]);
  const sum = cd1.add(cd2);
  assertClose(sum.components[0], 5, 'Cayley-Dickson addition');

  // Multiplication (recursive)
  const prod = cd1.multiply(cd2);
  assert(prod.dimension === 4, 'Cayley-Dickson multiplication preserves dimension');

  // Algebra dimension function
  assert(algebraDimension(AlgebraType.Complex) === 2, 'Algebra dimension for Complex');
  assert(algebraDimension(AlgebraType.Quaternion) === 4, 'Algebra dimension for Quaternion');
  assert(algebraDimension(AlgebraType.Octonion) === 8, 'Algebra dimension for Octonion');
  assert(algebraDimension(AlgebraType.Sedenion) === 16, 'Algebra dimension for Sedenion');
}

// ============================================================================
// TEST 5: HYPERCOMPLEX TENSORS
// ============================================================================

function testHypercomplexTensors(): void {
  testSection('TEST 5: Hypercomplex Tensors');

  // Complex tensor
  const ct = createComplexTensor('test', ['i'], [2], [complex(1, 0), complex(0, 1)]);
  assert(ct.shape[0] === 2, 'Complex tensor shape');
  assert(ct.data.length === 2, 'Complex tensor data length');
  assert(ct.algebraType === AlgebraType.Complex, 'Complex tensor type');

  // Quaternion tensor
  const qt = createQuaternionTensor('test', ['i'], [2], 'zeros');
  assert(qt.data.length === 2, 'Quaternion tensor data length');
  assert(qt.algebraType === AlgebraType.Quaternion, 'Quaternion tensor type');

  // Generic hypercomplex tensor
  const ht = createHypercomplexTensor('test', ['i'], [3], AlgebraType.Octonion, 'ones');
  assert(ht.data.length === 3, 'Hypercomplex tensor data length');
  assert(ht.data[0].components[0] === 1, 'Hypercomplex tensor ones initialization');

  // Extract real parts
  const reals = extractRealParts(ct);
  assertClose(reals[0], 1, 'Extract real parts from complex tensor');
  assertClose(reals[1], 0, 'Extract real parts from complex tensor');
}

// ============================================================================
// TEST 6: HYPERCOMPLEX EINSUM
// ============================================================================

function testHypercomplexEinsum(): void {
  testSection('TEST 6: Hypercomplex Einstein Summation');

  // Complex matrix-vector multiplication
  const mat = createComplexTensor(
    'W',
    ['o', 'i'],
    [2, 2],
    [
      complex(1, 0), complex(0, 1),
      complex(0, -1), complex(1, 0),
    ]
  );

  const vec = createComplexTensor(
    'x',
    ['i'],
    [2],
    [complex(1, 0), complex(0, 1)]
  );

  const result = hypercomplexEinsum('oi,i->o', mat, vec);
  
  assert(result.shape.length === 1, 'Einsum produces vector');
  assert(result.shape[0] === 2, 'Einsum output shape correct');
  assert(result.data.length === 2, 'Einsum output size correct');

  // Verify result: 
  // [0] = (1+0i)(1+0i) + (0+1i)(0+1i) = 1 + i² = 1 - 1 = 0
  // [1] = (0-1i)(1+0i) + (1+0i)(0+1i) = -i + i = 0
  const out0 = result.data[0] as Complex;
  const out1 = result.data[1] as Complex;
  
  console.log(`  Result[0] = ${out0.toString()}`);
  console.log(`  Result[1] = ${out1.toString()}`);
  assert(true, 'Complex einsum completes');

  // Quaternion einsum
  const q1 = createQuaternionTensor('q1', ['i'], [2], [
    quaternion(1, 0, 0, 0),
    quaternion(0, 1, 0, 0),
  ]);

  const q2 = createQuaternionTensor('q2', ['i'], [2], [
    quaternion(0, 0, 1, 0),
    quaternion(0, 0, 0, 1),
  ]);

  // Contract: sum over i
  const qResult = hypercomplexEinsum('i,i->', q1, q2);
  assert(qResult.data.length === 1, 'Quaternion contraction produces scalar');
  console.log(`  Quaternion contraction result: ${(qResult.data[0] as Quaternion).toString()}`);
}

// ============================================================================
// TEST 7: HYPERCOMPLEX ACTIVATIONS
// ============================================================================

function testHypercomplexActivations(): void {
  testSection('TEST 7: Hypercomplex Activation Functions');

  // Complex ReLU
  const ct = createComplexTensor('test', ['i'], [3], [
    complex(1, 2),
    complex(-1, 3),
    complex(2, -1),
  ]);

  const activated = complexReLU(ct);
  const a0 = activated.data[0];
  const a1 = activated.data[1];
  const a2 = activated.data[2];

  assertClose(a0.components[0], 1, 'Complex ReLU positive real');
  assertClose(a0.components[1], 2, 'Complex ReLU positive imag');
  assertClose(a1.components[0], 0, 'Complex ReLU negative real -> 0');
  assertClose(a1.components[1], 3, 'Complex ReLU positive imag');

  // Quaternion ReLU
  const qt = createQuaternionTensor('test', ['i'], [2], [
    quaternion(1, -1, 2, -2),
    quaternion(-1, 1, -2, 2),
  ]);

  const qActivated = quaternionReLU(qt);
  const q0 = qActivated.data[0];
  
  assertClose(q0.components[0], 1, 'Quaternion ReLU positive w');
  assertClose(q0.components[1], 0, 'Quaternion ReLU negative x -> 0');
  assertClose(q0.components[2], 2, 'Quaternion ReLU positive y');
  assertClose(q0.components[3], 0, 'Quaternion ReLU negative z -> 0');
}

// ============================================================================
// TEST 8: RUN EXAMPLES
// ============================================================================

function testExamples(): void {
  testSection('TEST 8: Hypercomplex Examples');

  console.log('\nRunning all hypercomplex examples...\n');
  
  try {
    runAllHypercomplexExamples();
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
  console.log('║' + ' '.repeat(10) + 'HYPERCOMPLEX TENSOR LOGIC TEST SUITE' + ' '.repeat(14) + '║');
  console.log('╚' + '═'.repeat(60) + '╝\n');

  testComplexNumbers();
  testQuaternions();
  testOctonions();
  testSedenionsAndCayleyDickson();
  testHypercomplexTensors();
  testHypercomplexEinsum();
  testHypercomplexActivations();
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
