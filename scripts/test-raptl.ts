#!/usr/bin/env tsx

/**
 * Unit Tests for RAPTL (Resource-Aware Probabilistic Tensor Logic)
 *
 * Tests for:
 * 1. Semiring abstractions
 * 2. PLN truth value operations
 * 3. Resource tracking
 * 4. Linear logic modalities
 * 5. RAPTL triple product structure
 */

import { fromMatrix, fromVector, getElement } from '../src/tensor-logic/core.js';

import {
  // Semirings
  BooleanSemiring,
  CountingSemiring,
  ViterbiSemiring,
  ProbabilisticSemiring,
  MinPlusSemiring,
  semiringEinsum,

  // PLN
  createTruthValue,
  plnConjunction,
  plnDisjunction,
  plnNegation,
  plnDeduction,
  plnRevision,
  createPLNTensor,
  plnTensorConjunction,

  // Resources
  createResourceProfile,
  estimateTensorResources,
  estimateEinsumResources,
  combineResourcesSequential,
  combineResourcesParallel,

  // Linear Logic
  createLinearTensor,
  createAffineTensor,
  createBangTensor,
  createWithTensor,
  useModalTensor,
  discardModalTensor,
  canUseModalTensor,

  // RAPTL
  createRAPTLFact,
  raptlConjunction,
  raptlDisjunction,
  raptlImplication,
  raptlThreshold,
  raptlGrandparent,
} from '../src/tensor-logic/raptl.js';

// ============================================================================
// TEST UTILITIES
// ============================================================================

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logModule(name: string) {
  log(`\n${'═'.repeat(70)}`, colors.magenta);
  log(`  ${name}`, colors.magenta);
  log(`${'═'.repeat(70)}`, colors.magenta);
}

function logTest(name: string) {
  log(`\n▶ ${name}`, colors.blue);
}

function logSuccess(message: string) {
  log(`  ✓ ${message}`, colors.green);
}

function logError(message: string) {
  log(`  ✗ ${message}`, colors.red);
}

const EPSILON = 1e-6;

function assertClose(actual: number, expected: number, message: string): boolean {
  const diff = Math.abs(actual - expected);
  if (diff <= EPSILON || (expected === Infinity && actual === Infinity) || (expected === -Infinity && actual === -Infinity)) {
    logSuccess(`${message}: ${actual} ≈ ${expected}`);
    return true;
  } else {
    logError(`${message}: got ${actual}, expected ${expected}`);
    return false;
  }
}

function assert(condition: boolean, message: string): boolean {
  if (condition) {
    logSuccess(message);
    return true;
  } else {
    logError(message);
    return false;
  }
}

function assertThrows(fn: () => void, message: string): boolean {
  try {
    fn();
    logError(`${message}: Expected error but none thrown`);
    return false;
  } catch {
    logSuccess(`${message}: Error thrown as expected`);
    return true;
  }
}

// ============================================================================
// SEMIRING TESTS
// ============================================================================

function testBooleanSemiring(): boolean {
  logTest('BooleanSemiring (OR, AND)');
  let passed = true;

  // Test identity elements
  passed = assert(BooleanSemiring.zero === false, 'Zero is false') && passed;
  passed = assert(BooleanSemiring.one === true, 'One is true') && passed;

  // Test operations
  passed = assert(BooleanSemiring.add(false, false) === false, 'false OR false = false') && passed;
  passed = assert(BooleanSemiring.add(true, false) === true, 'true OR false = true') && passed;
  passed = assert(BooleanSemiring.add(true, true) === true, 'true OR true = true') && passed;

  passed = assert(BooleanSemiring.mul(false, true) === false, 'false AND true = false') && passed;
  passed = assert(BooleanSemiring.mul(true, true) === true, 'true AND true = true') && passed;

  // Test conversion
  passed = assert(BooleanSemiring.fromNumber(0) === false, 'fromNumber(0) = false') && passed;
  passed = assert(BooleanSemiring.fromNumber(1) === true, 'fromNumber(1) = true') && passed;
  passed = assertClose(BooleanSemiring.toNumber(true), 1, 'toNumber(true) = 1') && passed;

  return passed;
}

function testCountingSemiring(): boolean {
  logTest('CountingSemiring (+, ×)');
  let passed = true;

  passed = assertClose(CountingSemiring.zero, 0, 'Zero is 0') && passed;
  passed = assertClose(CountingSemiring.one, 1, 'One is 1') && passed;

  passed = assertClose(CountingSemiring.add(3, 5), 8, '3 + 5 = 8') && passed;
  passed = assertClose(CountingSemiring.mul(3, 5), 15, '3 × 5 = 15') && passed;

  return passed;
}

function testViterbiSemiring(): boolean {
  logTest('ViterbiSemiring (max, +)');
  let passed = true;

  passed = assertClose(ViterbiSemiring.zero, -Infinity, 'Zero is -Infinity') && passed;
  passed = assertClose(ViterbiSemiring.one, 0, 'One is 0') && passed;

  passed = assertClose(ViterbiSemiring.add(3, 5), 5, 'max(3, 5) = 5') && passed;
  passed = assertClose(ViterbiSemiring.mul(3, 5), 8, '3 + 5 = 8') && passed;

  return passed;
}

function testMinPlusSemiring(): boolean {
  logTest('MinPlusSemiring (min, +)');
  let passed = true;

  passed = assertClose(MinPlusSemiring.zero, Infinity, 'Zero is Infinity') && passed;
  passed = assertClose(MinPlusSemiring.one, 0, 'One is 0') && passed;

  passed = assertClose(MinPlusSemiring.add(3, 5), 3, 'min(3, 5) = 3') && passed;
  passed = assertClose(MinPlusSemiring.mul(3, 5), 8, '3 + 5 = 8') && passed;

  return passed;
}

function testSemiringEinsum(): boolean {
  logTest('semiringEinsum');
  let passed = true;

  // Matrix multiplication with counting semiring (standard)
  const A = fromMatrix('A', ['i', 'j'], [[1, 2], [3, 4]]);
  const B = fromMatrix('B', ['j', 'k'], [[5, 6], [7, 8]]);

  const countResult = semiringEinsum(CountingSemiring, 'ij,jk->ik', A, B);
  passed = assertClose(getElement(countResult, 0, 0), 19, 'Counting matmul [0,0]') && passed;
  passed = assertClose(getElement(countResult, 1, 1), 50, 'Counting matmul [1,1]') && passed;

  // Boolean reachability
  const Reach = fromMatrix('Reach', ['i', 'j'], [[0, 1], [0, 0]]);
  const boolResult = semiringEinsum(BooleanSemiring, 'ij,jk->ik', Reach, Reach);
  passed = assertClose(getElement(boolResult, 0, 0), 0, 'Boolean reachability [0,0]') && passed;

  // Viterbi max path
  const Scores = fromMatrix('Scores', ['i', 'j'], [[1, 2], [3, 4]]);
  const viterbiResult = semiringEinsum(ViterbiSemiring, 'ij,jk->ik', Scores, Scores);
  passed = assert(viterbiResult.data.length === 4, 'Viterbi produces output') && passed;

  return passed;
}

// ============================================================================
// PLN TESTS
// ============================================================================

function testPLNTruthValues(): boolean {
  logTest('PLN Truth Values');
  let passed = true;

  // Create truth value
  const tv = createTruthValue(0.8, 0.9);
  passed = assertClose(tv.strength, 0.8, 'Strength is 0.8') && passed;
  passed = assertClose(tv.confidence, 0.9, 'Confidence is 0.9') && passed;

  // Clamping
  const clamped = createTruthValue(1.5, -0.5);
  passed = assertClose(clamped.strength, 1, 'Strength clamped to 1') && passed;
  passed = assertClose(clamped.confidence, 0, 'Confidence clamped to 0') && passed;

  return passed;
}

function testPLNConjunction(): boolean {
  logTest('PLN Conjunction');
  let passed = true;

  const a = createTruthValue(0.8, 0.9);
  const b = createTruthValue(0.6, 0.8);
  const result = plnConjunction(a, b);

  // Conjunction: strength multiplies
  passed = assertClose(result.strength, 0.8 * 0.6, 'Conjunction strength') && passed;
  // Confidence multiplies
  passed = assertClose(result.confidence, 0.9 * 0.8, 'Conjunction confidence') && passed;

  return passed;
}

function testPLNDisjunction(): boolean {
  logTest('PLN Disjunction');
  let passed = true;

  const a = createTruthValue(0.6, 0.9);
  const b = createTruthValue(0.4, 0.8);
  const result = plnDisjunction(a, b);

  // Disjunction: P(A ∨ B) = P(A) + P(B) - P(A)P(B)
  const expectedStrength = 0.6 + 0.4 - 0.6 * 0.4;
  passed = assertClose(result.strength, expectedStrength, 'Disjunction strength') && passed;
  passed = assertClose(result.confidence, 0.8, 'Disjunction confidence (min)') && passed;

  return passed;
}

function testPLNNegation(): boolean {
  logTest('PLN Negation');
  let passed = true;

  const a = createTruthValue(0.7, 0.9);
  const result = plnNegation(a);

  passed = assertClose(result.strength, 0.3, 'Negation strength') && passed;
  passed = assertClose(result.confidence, 0.9, 'Negation preserves confidence') && passed;

  return passed;
}

function testPLNRevision(): boolean {
  logTest('PLN Revision');
  let passed = true;

  const a = createTruthValue(0.8, 0.6);
  const b = createTruthValue(0.4, 0.4);
  const result = plnRevision(a, b);

  // Weighted average: (0.8*0.6 + 0.4*0.4) / (0.6 + 0.4) = 0.64
  const expectedStrength = (0.8 * 0.6 + 0.4 * 0.4) / (0.6 + 0.4);
  passed = assertClose(result.strength, expectedStrength, 'Revision strength') && passed;
  // Revision combines evidence using formula: (w1+w2) / (w1+w2+1)
  // With w1=0.6, w2=0.4: confidence = 1.0 / 2.0 = 0.5
  const expectedConfidence = (a.confidence + b.confidence) / (a.confidence + b.confidence + 1);
  passed = assertClose(result.confidence, expectedConfidence,
    'Revision confidence follows evidence combination formula') && passed;

  return passed;
}

function testPLNTensor(): boolean {
  logTest('PLN Tensor Operations');
  let passed = true;

  const t1 = fromVector('t1', 'i', [0.5, 0.7, 0.3]);
  const t2 = fromVector('t2', 'i', [0.6, 0.4, 0.8]);

  const pln1 = createPLNTensor(t1, 0.9);
  const pln2 = createPLNTensor(t2, 0.8);

  passed = assert(pln1.truthValues.length === 3, 'PLN tensor has 3 truth values') && passed;
  passed = assertClose(pln1.truthValues[0].strength, 0.5, 'First TV strength') && passed;
  passed = assertClose(pln1.truthValues[0].confidence, 0.9, 'First TV confidence') && passed;

  // Conjunction
  const conj = plnTensorConjunction(pln1, pln2);
  passed = assertClose(conj.tensor.data[0], 0.5 * 0.6, 'Tensor conjunction value') && passed;
  passed = assertClose(conj.truthValues[0].confidence, 0.9 * 0.8, 'Tensor conjunction confidence') && passed;

  return passed;
}

// ============================================================================
// RESOURCE TRACKING TESTS
// ============================================================================

function testResourceProfile(): boolean {
  logTest('Resource Profile');
  let passed = true;

  const profile = createResourceProfile();
  passed = assertClose(profile.flops, 0, 'Initial FLOPs is 0') && passed;
  passed = assertClose(profile.hbmBytes, 0, 'Initial HBM bytes is 0') && passed;
  passed = assertClose(profile.density, 1.0, 'Initial density is 1.0') && passed;

  return passed;
}

function testEstimateTensorResources(): boolean {
  logTest('Estimate Tensor Resources');
  let passed = true;

  const tensor = fromMatrix('M', ['i', 'j'], [[1, 2, 3], [4, 5, 6]]);
  const resources = estimateTensorResources(tensor);

  passed = assertClose(resources.hbmBytes, 6 * 8, 'HBM bytes = 6 elements × 8 bytes') && passed;
  passed = assert(resources.nnz === 6, 'NNZ = 6 (all non-zero)') && passed;
  passed = assertClose(resources.density, 1.0, 'Density = 1.0') && passed;
  passed = assertClose(resources.rank, 2, 'Rank = 2') && passed;

  // Test sparse tensor
  const sparse = fromMatrix('S', ['i', 'j'], [[0, 1, 0], [0, 0, 1]]);
  const sparseResources = estimateTensorResources(sparse);
  passed = assert(sparseResources.nnz === 2, 'Sparse NNZ = 2') && passed;
  passed = assertClose(sparseResources.density, 2 / 6, 'Sparse density') && passed;

  return passed;
}

function testEstimateEinsumResources(): boolean {
  logTest('Estimate Einsum Resources');
  let passed = true;

  const A = fromMatrix('A', ['i', 'j'], [[1, 2], [3, 4]]);
  const B = fromMatrix('B', ['j', 'k'], [[5, 6], [7, 8]]);

  const resources = estimateEinsumResources('ij,jk->ik', A, B);

  // Matmul: 2×2×2 = 8 iterations, each with 2 muls and 1 add
  passed = assert(resources.flops > 0, 'FLOPs > 0') && passed;
  passed = assert(resources.hbmBytes > 0, 'HBM bytes > 0') && passed;
  passed = assertClose(resources.rank, 2, 'Output rank = 2') && passed;

  return passed;
}

function testCombineResources(): boolean {
  logTest('Combine Resources');
  let passed = true;

  const r1 = { ...createResourceProfile(), flops: 100, hbmBytes: 1000 };
  const r2 = { ...createResourceProfile(), flops: 200, hbmBytes: 2000 };

  // Sequential: flops sum, memory max
  const seq = combineResourcesSequential(r1, r2);
  passed = assertClose(seq.flops, 300, 'Sequential FLOPs sum') && passed;
  passed = assertClose(seq.hbmBytes, 2000, 'Sequential HBM max') && passed;

  // Parallel: flops max, memory sum
  const par = combineResourcesParallel(r1, r2);
  passed = assertClose(par.flops, 200, 'Parallel FLOPs max') && passed;
  passed = assertClose(par.hbmBytes, 3000, 'Parallel HBM sum') && passed;

  return passed;
}

// ============================================================================
// LINEAR LOGIC MODALITY TESTS
// ============================================================================

function testLinearTensor(): boolean {
  logTest('Linear Tensor (single use)');
  let passed = true;

  const tensor = fromVector('v', 'i', [1, 2, 3]);
  const linear = createLinearTensor(tensor);

  passed = assert(linear.modality === 'linear', 'Modality is linear') && passed;
  passed = assert(canUseModalTensor(linear), 'Can use initially') && passed;

  // First use succeeds
  const used = useModalTensor(linear);
  passed = assert(used.data[0] === 1, 'First use returns data') && passed;
  passed = assert(!canUseModalTensor(linear), 'Cannot use again') && passed;

  // Second use fails
  passed = assertThrows(() => useModalTensor(linear), 'Second use throws') && passed;

  // Cannot discard unused linear tensor (but this one is used, so it's fine)

  return passed;
}

function testAffineTensor(): boolean {
  logTest('Affine Tensor (at most once)');
  let passed = true;

  const tensor = fromVector('v', 'i', [1, 2, 3]);
  const affine = createAffineTensor(tensor);

  passed = assert(affine.modality === 'affine', 'Modality is affine') && passed;

  // Can discard without using
  const affine2 = createAffineTensor(tensor);
  discardModalTensor(affine2);
  passed = assert(!canUseModalTensor(affine2), 'Discarded tensor cannot be used') && passed;

  // Can use once
  const used = useModalTensor(affine);
  passed = assert(used.data[0] === 1, 'Use returns data') && passed;

  return passed;
}

function testBangTensor(): boolean {
  logTest('Bang Tensor (unlimited reads)');
  let passed = true;

  const tensor = fromVector('v', 'i', [1, 2, 3]);
  const bang = createBangTensor(tensor);

  passed = assert(bang.modality === 'bang', 'Modality is bang') && passed;

  // Can use multiple times
  const use1 = useModalTensor(bang);
  const use2 = useModalTensor(bang);
  const use3 = useModalTensor(bang);

  passed = assert(use1.data[0] === 1, 'First use') && passed;
  passed = assert(use2.data[0] === 1, 'Second use') && passed;
  passed = assert(use3.data[0] === 1, 'Third use') && passed;
  passed = assert(canUseModalTensor(bang), 'Still usable after 3 uses') && passed;

  // Uses return clones (independent)
  use1.data[0] = 999;
  const use4 = useModalTensor(bang);
  passed = assert(use4.data[0] === 1, 'Clone is independent') && passed;

  return passed;
}

function testWithTensor(): boolean {
  logTest('With Tensor (conditional)');
  let passed = true;

  const tensor = fromVector('v', 'i', [1, 2, 3]);
  const withT = createWithTensor(tensor);

  passed = assert(withT.modality === 'with', 'Modality is with') && passed;
  passed = assert(canUseModalTensor(withT), 'Can use initially') && passed;

  const used = useModalTensor(withT);
  passed = assert(used.data[0] === 1, 'Use returns data') && passed;
  passed = assert(!canUseModalTensor(withT), 'Cannot use after choice') && passed;

  return passed;
}

// ============================================================================
// RAPTL TRIPLE PRODUCT TESTS
// ============================================================================

function testRAPTLFact(): boolean {
  logTest('RAPTL Fact Creation');
  let passed = true;

  const tensor = fromMatrix('R', ['x', 'y'], [[1, 0], [0, 1]]);
  const fact = createRAPTLFact('relation', tensor, 0.9, 0.8, 'bang');

  passed = assert(fact.id === 'relation', 'Fact has correct id') && passed;
  passed = assert(fact.logic.data.length === 4, 'Logic tensor present') && passed;
  passed = assertClose(fact.uncertainty.strength, 0.9, 'Uncertainty strength') && passed;
  passed = assertClose(fact.uncertainty.confidence, 0.8, 'Uncertainty confidence') && passed;
  passed = assert(fact.resources.hbmBytes > 0, 'Resources tracked') && passed;
  passed = assert(fact.modality === 'bang', 'Modality set') && passed;

  return passed;
}

function testRAPTLConjunction(): boolean {
  logTest('RAPTL Conjunction');
  let passed = true;

  const t1 = fromVector('t1', 'i', [0.8, 0.6, 0.4]);
  const t2 = fromVector('t2', 'i', [0.5, 0.7, 0.9]);

  const f1 = createRAPTLFact('f1', t1, 0.9, 0.8);
  const f2 = createRAPTLFact('f2', t2, 0.7, 0.9);

  const conj = raptlConjunction(f1, f2);

  // Logic: element-wise multiply
  passed = assertClose(conj.logic.data[0], 0.8 * 0.5, 'Conjunction logic') && passed;

  // Uncertainty: PLN conjunction
  passed = assertClose(conj.uncertainty.strength, 0.9 * 0.7, 'Conjunction strength') && passed;

  // Resources: combined
  passed = assert(conj.resources.flops >= 0, 'Resources tracked') && passed;

  // ID reflects operation
  passed = assert(conj.id.includes('∧'), 'ID shows conjunction') && passed;

  return passed;
}

function testRAPTLDisjunction(): boolean {
  logTest('RAPTL Disjunction');
  let passed = true;

  const t1 = fromVector('t1', 'i', [0.3, 0.5]);
  const t2 = fromVector('t2', 'i', [0.4, 0.2]);

  const f1 = createRAPTLFact('f1', t1, 0.8, 0.7);
  const f2 = createRAPTLFact('f2', t2, 0.6, 0.9);

  const disj = raptlDisjunction(f1, f2);

  // Logic: element-wise add
  passed = assertClose(disj.logic.data[0], 0.3 + 0.4, 'Disjunction logic') && passed;

  // Modality: with (choice)
  passed = assert(disj.modality === 'with', 'Disjunction creates with modality') && passed;

  passed = assert(disj.id.includes('∨'), 'ID shows disjunction') && passed;

  return passed;
}

function testRAPTLImplication(): boolean {
  logTest('RAPTL Implication');
  let passed = true;

  const rule = fromMatrix('rule', ['x', 'y'], [[1, 2], [3, 4]]);
  const ante = fromVector('ante', 'y', [0.5, 0.5]);

  const ruleFact = createRAPTLFact('rule', rule, 0.95, 0.9);
  const anteFact = createRAPTLFact('ante', ante, 0.8, 0.85);

  const impl = raptlImplication(ruleFact, anteFact, 'xy,y->x');

  // Logic: einsum result
  passed = assert(impl.logic.shape[0] === 2, 'Implication output shape') && passed;

  // Uncertainty: combined
  passed = assert(impl.uncertainty.strength < 1, 'Implication has uncertainty') && passed;

  // Resources: includes einsum cost
  passed = assert(impl.resources.flops > 0, 'Implication tracks FLOPs') && passed;

  return passed;
}

function testRAPTLThreshold(): boolean {
  logTest('RAPTL Threshold');
  let passed = true;

  const tensor = fromVector('t', 'i', [-0.5, 0.5, 1.5]);
  const fact = createRAPTLFact('fact', tensor, 0.9, 0.95);

  const thresholded = raptlThreshold(fact, 0);

  passed = assertClose(thresholded.logic.data[0], 0, 'Below threshold -> 0') && passed;
  passed = assertClose(thresholded.logic.data[1], 1, 'Above threshold -> 1') && passed;
  passed = assertClose(thresholded.logic.data[2], 1, 'Above threshold -> 1') && passed;

  // Confidence slightly reduced
  passed = assert(thresholded.uncertainty.confidence < fact.uncertainty.confidence,
    'Threshold reduces confidence') && passed;

  passed = assert(thresholded.id.includes('H('), 'ID shows threshold') && passed;

  return passed;
}

function testRAPTLGrandparent(): boolean {
  logTest('RAPTL Grandparent Rule');
  let passed = true;

  // Parent relation: A->B, B->C
  //     A  B  C
  // A [ 0  1  0 ]
  // B [ 0  0  1 ]
  // C [ 0  0  0 ]
  const parent = fromMatrix('Parent', ['x', 'y'], [
    [0, 1, 0],
    [0, 0, 1],
    [0, 0, 0],
  ]);

  const parentFact = createRAPTLFact('Parent', parent, 1.0, 0.95);
  const grandparent = raptlGrandparent(parentFact);

  // Grandparent[A,C] should be 1 (A -> B -> C)
  passed = assertClose(getElement(grandparent.logic, 0, 2), 1, 'A is grandparent of C') && passed;
  passed = assertClose(getElement(grandparent.logic, 0, 0), 0, 'A is not grandparent of A') && passed;
  passed = assertClose(getElement(grandparent.logic, 1, 0), 0, 'B is not grandparent of A') && passed;

  // Uncertainty propagates
  passed = assert(grandparent.uncertainty.strength <= parentFact.uncertainty.strength,
    'Grandparent strength <= Parent strength') && passed;
  passed = assert(grandparent.uncertainty.confidence < parentFact.uncertainty.confidence,
    'Grandparent confidence < Parent confidence') && passed;

  // Resources tracked
  passed = assert(grandparent.resources.flops > parentFact.resources.flops,
    'Grandparent computation costs more FLOPs') && passed;

  return passed;
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllRAPTLTests() {
  log('\n' + '═'.repeat(70), colors.cyan);
  log('  RAPTL - Resource-Aware Probabilistic Tensor Logic', colors.cyan);
  log('  Unit Test Suite', colors.cyan);
  log('═'.repeat(70), colors.cyan);

  const modules: { name: string; tests: Array<{ name: string; fn: () => boolean }> }[] = [
    {
      name: 'SEMIRING ABSTRACTIONS',
      tests: [
        { name: 'Boolean Semiring', fn: testBooleanSemiring },
        { name: 'Counting Semiring', fn: testCountingSemiring },
        { name: 'Viterbi Semiring', fn: testViterbiSemiring },
        { name: 'MinPlus Semiring', fn: testMinPlusSemiring },
        { name: 'Semiring Einsum', fn: testSemiringEinsum },
      ],
    },
    {
      name: 'PLN TRUTH VALUES',
      tests: [
        { name: 'Truth Value Creation', fn: testPLNTruthValues },
        { name: 'PLN Conjunction', fn: testPLNConjunction },
        { name: 'PLN Disjunction', fn: testPLNDisjunction },
        { name: 'PLN Negation', fn: testPLNNegation },
        { name: 'PLN Revision', fn: testPLNRevision },
        { name: 'PLN Tensor', fn: testPLNTensor },
      ],
    },
    {
      name: 'RESOURCE TRACKING',
      tests: [
        { name: 'Resource Profile', fn: testResourceProfile },
        { name: 'Estimate Tensor Resources', fn: testEstimateTensorResources },
        { name: 'Estimate Einsum Resources', fn: testEstimateEinsumResources },
        { name: 'Combine Resources', fn: testCombineResources },
      ],
    },
    {
      name: 'LINEAR LOGIC MODALITIES',
      tests: [
        { name: 'Linear Tensor', fn: testLinearTensor },
        { name: 'Affine Tensor', fn: testAffineTensor },
        { name: 'Bang Tensor', fn: testBangTensor },
        { name: 'With Tensor', fn: testWithTensor },
      ],
    },
    {
      name: 'RAPTL TRIPLE PRODUCT',
      tests: [
        { name: 'RAPTL Fact', fn: testRAPTLFact },
        { name: 'RAPTL Conjunction', fn: testRAPTLConjunction },
        { name: 'RAPTL Disjunction', fn: testRAPTLDisjunction },
        { name: 'RAPTL Implication', fn: testRAPTLImplication },
        { name: 'RAPTL Threshold', fn: testRAPTLThreshold },
        { name: 'RAPTL Grandparent Rule', fn: testRAPTLGrandparent },
      ],
    },
  ];

  let totalPassed = 0;
  let totalFailed = 0;

  for (const module of modules) {
    logModule(module.name);

    for (const test of module.tests) {
      try {
        if (test.fn()) {
          totalPassed++;
        } else {
          totalFailed++;
        }
      } catch (error) {
        totalFailed++;
        logTest(test.name);
        logError(`Test threw error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  log('\n' + '═'.repeat(70), colors.cyan);
  log(`  FINAL RESULTS: ${totalPassed} passed, ${totalFailed} failed`, colors.cyan);
  if (totalFailed === 0) {
    log('  ALL RAPTL TESTS PASSED!', colors.green);
  } else {
    log('  SOME TESTS FAILED - Review above for details', colors.red);
  }
  log('═'.repeat(70) + '\n', colors.cyan);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runAllRAPTLTests();
