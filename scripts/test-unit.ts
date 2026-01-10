#!/usr/bin/env tsx

/**
 * Exhaustive Unit Test Suite for Neural Nestor Gauge Logic Framework
 *
 * Tests every exported function in:
 * - core.ts: Tensor operations, einsum, activations
 * - nestor.ts: Nestor structures, morphisms, gauge connections
 * - neural-nestor-morph.ts: Neural networks, fiber forests, functors
 * - utils.ts: Broadcast operations, slicing
 */

// ============================================================================
// IMPORTS
// ============================================================================

import {
  Tensor,
  createTensor,
  fromMatrix,
  fromVector,
  getElement,
  setElement,
  einsum,
  threshold,
  sigmoid,
  relu,
  softmax,
  add,
  multiply,
  scale,
  transpose,
  tensorToString,
  clone,
  identity,
} from '../src/tensor-logic/core.js';

import {
  Nestor,
  NestorType,
  FiberBundle,
  NestorMorphism,
  GaugeConnection,
  createNestor,
  createFiberBundle,
  attachFiberBundle,
  nestorDepth,
  nestorNodeCount,
  traverseNestor,
  mapNestorTensors,
  aggregateNestor,
  createGaugeConnection,
  parallelTransport,
  computeNestorGradient,
  gaugeTransform,
  composeMorphisms,
  identityMorphism,
  createNestorMorphism,
  isStructurePreserving,
} from '../src/tensor-logic/nestor.js';

import {
  NeuralNestor,
  FiberForest,
  GaugeTransformer,
  CategoricalContext,
  Functor,
  createNeuralNestor,
  neuralNestorForward,
  createFiberForest,
  embedNestorInForest,
  createGaugeTransformer,
  gaugeTransformerAttention,
  createCategoricalContext,
  addObject,
  addMorphism,
  composeInContext,
  addFunctor,
  createEmbeddingFunctor,
  applyFunctor,
  createTypedHyperGraphNN,
  neuralNestorMorphForward,
} from '../src/tensor-logic/neural-nestor-morph.js';

import {
  broadcastAdd,
  broadcastMultiply,
  extractSlice,
} from '../src/tensor-logic/utils.js';

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
  if (diff <= EPSILON) {
    logSuccess(`${message}: ${actual.toFixed(6)} ≈ ${expected.toFixed(6)}`);
    return true;
  } else {
    logError(`${message}: got ${actual.toFixed(6)}, expected ${expected.toFixed(6)}`);
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
// CORE.TS TESTS
// ============================================================================

function testCreateTensor(): boolean {
  logTest('createTensor');
  let passed = true;

  // Test zeros initialization
  const zeros = createTensor('zeros', ['i', 'j'], [2, 3], 'zeros');
  passed = assert(zeros.name === 'zeros', 'Name is set correctly') && passed;
  passed = assert(zeros.shape[0] === 2 && zeros.shape[1] === 3, 'Shape is [2, 3]') && passed;
  passed = assert(zeros.indices[0] === 'i' && zeros.indices[1] === 'j', 'Indices are [i, j]') && passed;
  passed = assert(zeros.data.length === 6, 'Data length is 6') && passed;
  passed = assert(zeros.data.every(v => v === 0), 'All values are 0') && passed;

  // Test ones initialization
  const ones = createTensor('ones', ['x'], [4], 'ones');
  passed = assert(ones.data.every(v => v === 1), 'All values are 1') && passed;

  // Test random initialization
  const random = createTensor('random', ['a', 'b'], [3, 3], 'random');
  passed = assert(random.data.some(v => v !== 0), 'Random has non-zero values') && passed;
  passed = assert(random.data.every(v => v >= -1 && v <= 1), 'Random values in [-1, 1]') && passed;

  // Test Float64Array initialization
  const customData = new Float64Array([1, 2, 3, 4]);
  const custom = createTensor('custom', ['x', 'y'], [2, 2], customData);
  passed = assert(custom.data[0] === 1 && custom.data[3] === 4, 'Custom data is preserved') && passed;

  return passed;
}

function testFromMatrix(): boolean {
  logTest('fromMatrix');
  let passed = true;

  const matrix = fromMatrix('M', ['i', 'j'], [[1, 2, 3], [4, 5, 6]]);
  passed = assert(matrix.shape[0] === 2 && matrix.shape[1] === 3, 'Shape is [2, 3]') && passed;
  passed = assertClose(matrix.data[0], 1, 'M[0,0] = 1') && passed;
  passed = assertClose(matrix.data[2], 3, 'M[0,2] = 3') && passed;
  passed = assertClose(matrix.data[5], 6, 'M[1,2] = 6') && passed;

  // Test empty matrix edge case
  const empty = fromMatrix('empty', ['i', 'j'], []);
  passed = assert(empty.shape[0] === 0 && empty.shape[1] === 0, 'Empty matrix shape is [0, 0]') && passed;

  return passed;
}

function testFromVector(): boolean {
  logTest('fromVector');
  let passed = true;

  const vec = fromVector('v', 'i', [1, 2, 3, 4, 5]);
  passed = assert(vec.shape[0] === 5, 'Shape is [5]') && passed;
  passed = assert(vec.indices[0] === 'i', 'Index is i') && passed;
  passed = assertClose(vec.data[0], 1, 'v[0] = 1') && passed;
  passed = assertClose(vec.data[4], 5, 'v[4] = 5') && passed;

  return passed;
}

function testGetSetElement(): boolean {
  logTest('getElement / setElement');
  let passed = true;

  const tensor = createTensor('t', ['i', 'j', 'k'], [2, 3, 4], 'zeros');

  // Set and get elements
  setElement(tensor, 42, 1, 2, 3);
  passed = assertClose(getElement(tensor, 1, 2, 3), 42, 'Get after set') && passed;

  setElement(tensor, 7, 0, 0, 0);
  passed = assertClose(getElement(tensor, 0, 0, 0), 7, 'First element') && passed;

  // Test 2D tensor
  const matrix = fromMatrix('M', ['i', 'j'], [[1, 2], [3, 4]]);
  passed = assertClose(getElement(matrix, 0, 0), 1, 'M[0,0]') && passed;
  passed = assertClose(getElement(matrix, 1, 1), 4, 'M[1,1]') && passed;

  return passed;
}

function testEinsum(): boolean {
  logTest('einsum');
  let passed = true;

  // Matrix multiplication: C = A @ B
  const A = fromMatrix('A', ['i', 'j'], [[1, 2], [3, 4]]);
  const B = fromMatrix('B', ['j', 'k'], [[5, 6], [7, 8]]);
  const C = einsum('ij,jk->ik', A, B);
  passed = assertClose(getElement(C, 0, 0), 19, 'Matmul [0,0]') && passed;
  passed = assertClose(getElement(C, 1, 1), 50, 'Matmul [1,1]') && passed;

  // Dot product: scalar = v · w
  const v = fromVector('v', 'i', [1, 2, 3]);
  const w = fromVector('w', 'i', [4, 5, 6]);
  const dot = einsum('i,i->', v, w);
  passed = assertClose(dot.data[0], 32, 'Dot product') && passed;

  // Outer product: M = v ⊗ w
  const outer = einsum('i,j->ij', v, w);
  passed = assertClose(getElement(outer, 0, 0), 4, 'Outer [0,0]') && passed;
  passed = assertClose(getElement(outer, 2, 2), 18, 'Outer [2,2]') && passed;

  // Trace: tr(M) = sum of diagonal
  const traceInput = fromMatrix('T', ['i', 'j'], [[1, 2], [3, 4]]);
  // Note: einsum 'ii->' requires same index twice - test matrix-vector instead
  const diagVec = fromVector('d', 'i', [1, 1]);
  const matVec = einsum('ij,j->i', traceInput, diagVec);
  passed = assertClose(matVec.data[0], 3, 'Matrix-vector [0]') && passed; // 1+2
  passed = assertClose(matVec.data[1], 7, 'Matrix-vector [1]') && passed; // 3+4

  // Test error on inconsistent sizes
  const badA = fromMatrix('badA', ['i', 'j'], [[1, 2, 3]]);
  const badB = fromMatrix('badB', ['j', 'k'], [[1], [2]]); // j size mismatch
  passed = assertThrows(() => einsum('ij,jk->ik', badA, badB), 'Inconsistent sizes throws') && passed;

  return passed;
}

function testThreshold(): boolean {
  logTest('threshold');
  let passed = true;

  const input = fromVector('x', 'i', [-2, -0.5, 0, 0.5, 2]);
  const output = threshold(input, 0);

  passed = assertClose(output.data[0], 0, 'threshold(-2) = 0') && passed;
  passed = assertClose(output.data[1], 0, 'threshold(-0.5) = 0') && passed;
  passed = assertClose(output.data[2], 0, 'threshold(0) = 0') && passed;
  passed = assertClose(output.data[3], 1, 'threshold(0.5) = 1') && passed;
  passed = assertClose(output.data[4], 1, 'threshold(2) = 1') && passed;

  // Test custom threshold
  const custom = threshold(input, 0.5);
  passed = assertClose(custom.data[3], 0, 'threshold(0.5, t=0.5) = 0') && passed;
  passed = assertClose(custom.data[4], 1, 'threshold(2, t=0.5) = 1') && passed;

  return passed;
}

function testSigmoid(): boolean {
  logTest('sigmoid');
  let passed = true;

  const input = fromVector('x', 'i', [0, 1, -1, 10, -10]);
  const output = sigmoid(input, 1);

  passed = assertClose(output.data[0], 0.5, 'sigmoid(0) = 0.5') && passed;
  passed = assert(output.data[1] > 0.5 && output.data[1] < 1, 'sigmoid(1) in (0.5, 1)') && passed;
  passed = assert(output.data[2] > 0 && output.data[2] < 0.5, 'sigmoid(-1) in (0, 0.5)') && passed;
  passed = assert(output.data[3] > 0.99, 'sigmoid(10) ≈ 1') && passed;
  passed = assert(output.data[4] < 0.01, 'sigmoid(-10) ≈ 0') && passed;

  // Test temperature 0 (hard threshold)
  const hard = sigmoid(input, 0);
  passed = assertClose(hard.data[0], 0, 'sigmoid(0, T=0) = 0') && passed;
  passed = assertClose(hard.data[1], 1, 'sigmoid(1, T=0) = 1') && passed;

  return passed;
}

function testRelu(): boolean {
  logTest('relu');
  let passed = true;

  const input = fromVector('x', 'i', [-5, -1, 0, 1, 5]);
  const output = relu(input);

  passed = assertClose(output.data[0], 0, 'relu(-5) = 0') && passed;
  passed = assertClose(output.data[1], 0, 'relu(-1) = 0') && passed;
  passed = assertClose(output.data[2], 0, 'relu(0) = 0') && passed;
  passed = assertClose(output.data[3], 1, 'relu(1) = 1') && passed;
  passed = assertClose(output.data[4], 5, 'relu(5) = 5') && passed;

  return passed;
}

function testSoftmax(): boolean {
  logTest('softmax');
  let passed = true;

  // 1D softmax
  const input1D = fromVector('x', 'i', [1, 2, 3]);
  const output1D = softmax(input1D);
  const sum1D = output1D.data.reduce((a, b) => a + b, 0);
  passed = assertClose(sum1D, 1, 'Softmax 1D sums to 1') && passed;
  passed = assert(output1D.data[2] > output1D.data[1] && output1D.data[1] > output1D.data[0],
    'Softmax preserves order') && passed;

  // 2D softmax along axis 1
  const input2D = fromMatrix('M', ['i', 'j'], [[1, 2, 3], [4, 5, 6]]);
  const output2D = softmax(input2D, 1);
  const row0Sum = output2D.data[0] + output2D.data[1] + output2D.data[2];
  const row1Sum = output2D.data[3] + output2D.data[4] + output2D.data[5];
  passed = assertClose(row0Sum, 1, 'Softmax 2D row 0 sums to 1') && passed;
  passed = assertClose(row1Sum, 1, 'Softmax 2D row 1 sums to 1') && passed;

  // Test error for unsupported dimensions
  const tensor3D = createTensor('3D', ['i', 'j', 'k'], [2, 2, 2], 'ones');
  passed = assertThrows(() => softmax(tensor3D), 'Softmax 3D throws error') && passed;

  return passed;
}

function testAddMultiplyScale(): boolean {
  logTest('add / multiply / scale');
  let passed = true;

  const a = fromVector('a', 'i', [1, 2, 3]);
  const b = fromVector('b', 'i', [4, 5, 6]);

  // Add
  const sum = add(a, b);
  passed = assertClose(sum.data[0], 5, 'add [0]') && passed;
  passed = assertClose(sum.data[2], 9, 'add [2]') && passed;

  // Multiply (Hadamard)
  const prod = multiply(a, b);
  passed = assertClose(prod.data[0], 4, 'multiply [0]') && passed;
  passed = assertClose(prod.data[2], 18, 'multiply [2]') && passed;

  // Scale
  const scaled = scale(a, 2);
  passed = assertClose(scaled.data[0], 2, 'scale [0]') && passed;
  passed = assertClose(scaled.data[2], 6, 'scale [2]') && passed;

  // Multiple tensors
  const c = fromVector('c', 'i', [0.5, 0.5, 0.5]);
  const multiSum = add(a, b, c);
  passed = assertClose(multiSum.data[0], 5.5, 'add 3 tensors [0]') && passed;

  return passed;
}

function testTranspose(): boolean {
  logTest('transpose');
  let passed = true;

  const matrix = fromMatrix('M', ['i', 'j'], [[1, 2, 3], [4, 5, 6]]);
  const transposed = transpose(matrix);

  passed = assert(transposed.shape[0] === 3 && transposed.shape[1] === 2, 'Transposed shape [3, 2]') && passed;
  passed = assertClose(getElement(transposed, 0, 0), 1, 'T[0,0] = M[0,0]') && passed;
  passed = assertClose(getElement(transposed, 0, 1), 4, 'T[0,1] = M[1,0]') && passed;
  passed = assertClose(getElement(transposed, 2, 0), 3, 'T[2,0] = M[0,2]') && passed;
  passed = assertClose(getElement(transposed, 2, 1), 6, 'T[2,1] = M[1,2]') && passed;

  // Test error for 1D tensor
  const vec = fromVector('v', 'i', [1, 2, 3]);
  passed = assertThrows(() => transpose(vec), 'Transpose 1D throws') && passed;

  return passed;
}

function testTensorToString(): boolean {
  logTest('tensorToString');
  let passed = true;

  const vec = fromVector('v', 'i', [1.5, 2.5]);
  const vecStr = tensorToString(vec, 1);
  passed = assert(vecStr.includes('1.5') && vecStr.includes('2.5'), '1D tensor string') && passed;

  const matrix = fromMatrix('M', ['i', 'j'], [[1, 2], [3, 4]]);
  const matStr = tensorToString(matrix, 0);
  passed = assert(matStr.includes('[') && matStr.includes('1') && matStr.includes('4'), '2D tensor string') && passed;

  const tensor3D = createTensor('3D', ['a', 'b', 'c'], [2, 2, 2], 'ones');
  const str3D = tensorToString(tensor3D);
  passed = assert(str3D.includes('a='), '3D tensor shows slice indices') && passed;

  const tensor4D = createTensor('4D', ['a', 'b', 'c', 'd'], [2, 2, 2, 2], 'ones');
  const str4D = tensorToString(tensor4D);
  passed = assert(str4D.includes('Tensor') && str4D.includes('shape'), '4D tensor summary') && passed;

  return passed;
}

function testClone(): boolean {
  logTest('clone');
  let passed = true;

  const original = fromMatrix('M', ['i', 'j'], [[1, 2], [3, 4]]);
  const cloned = clone(original);

  passed = assert(cloned.name === original.name, 'Clone preserves name') && passed;
  passed = assert(cloned.shape[0] === original.shape[0], 'Clone preserves shape') && passed;
  passed = assertClose(cloned.data[0], original.data[0], 'Clone preserves data') && passed;

  // Modify clone, original should be unchanged
  cloned.data[0] = 999;
  passed = assertClose(original.data[0], 1, 'Original unchanged after clone modification') && passed;

  return passed;
}

function testIdentity(): boolean {
  logTest('identity');
  let passed = true;

  const I = identity('I', ['i', 'j'], 3);
  passed = assert(I.shape[0] === 3 && I.shape[1] === 3, 'Identity shape [3, 3]') && passed;
  passed = assertClose(getElement(I, 0, 0), 1, 'I[0,0] = 1') && passed;
  passed = assertClose(getElement(I, 1, 1), 1, 'I[1,1] = 1') && passed;
  passed = assertClose(getElement(I, 2, 2), 1, 'I[2,2] = 1') && passed;
  passed = assertClose(getElement(I, 0, 1), 0, 'I[0,1] = 0') && passed;
  passed = assertClose(getElement(I, 1, 0), 0, 'I[1,0] = 0') && passed;

  return passed;
}

// ============================================================================
// NESTOR.TS TESTS
// ============================================================================

function createTestNestorType(): NestorType {
  return {
    nodeType: 'test',
    edgeTypes: ['edge1'],
    signature: { inputShape: [3], outputShape: [3], indices: ['i'] },
  };
}

function testCreateNestor(): boolean {
  logTest('createNestor');
  let passed = true;

  const tensor = fromVector('t', 'i', [1, 2, 3]);
  const typeInfo = createTestNestorType();
  const nestor = createNestor('n1', tensor, typeInfo);

  passed = assert(nestor.id === 'n1', 'Nestor has correct id') && passed;
  passed = assert(nestor.tensor === tensor, 'Nestor has correct tensor') && passed;
  passed = assert(nestor.children.length === 0, 'Nestor has no children') && passed;
  passed = assert(nestor.typeInfo.nodeType === 'test', 'Nestor has correct type') && passed;

  // With children
  const child = createNestor('child', tensor, typeInfo);
  const parent = createNestor('parent', tensor, typeInfo, [child]);
  passed = assert(parent.children.length === 1, 'Parent has 1 child') && passed;
  passed = assert(parent.children[0].id === 'child', 'Child has correct id') && passed;

  return passed;
}

function testFiberBundle(): boolean {
  logTest('createFiberBundle / attachFiberBundle');
  let passed = true;

  // Create fiber bundle
  const fiber = createFiberBundle('base1', 4);
  passed = assert(fiber.baseId === 'base1', 'Fiber has correct baseId') && passed;
  passed = assert(fiber.fiberDim === 4, 'Fiber has correct dimension') && passed;
  passed = assert(fiber.fiberData.shape[0] === 4, 'Fiber data has correct shape') && passed;

  // Attach to Nestor
  const tensor = fromVector('t', 'i', [1, 2, 3]);
  const nestor = createNestor('n1', tensor, createTestNestorType());
  const attached = attachFiberBundle(nestor, fiber);
  passed = assert(attached.fiber !== undefined, 'Fiber is attached') && passed;
  passed = assert(attached.fiber!.fiberDim === 4, 'Attached fiber has correct dim') && passed;
  passed = assert(attached.id === nestor.id, 'Nestor id preserved') && passed;

  return passed;
}

function testNestorDepthAndCount(): boolean {
  logTest('nestorDepth / nestorNodeCount');
  let passed = true;

  const typeInfo = createTestNestorType();
  const tensor = fromVector('t', 'i', [1, 2, 3]);

  // Single node
  const single = createNestor('single', tensor, typeInfo);
  passed = assert(nestorDepth(single) === 1, 'Single node depth = 1') && passed;
  passed = assert(nestorNodeCount(single) === 1, 'Single node count = 1') && passed;

  // Tree: parent -> [child1, child2 -> grandchild]
  const grandchild = createNestor('gc', tensor, typeInfo);
  const child1 = createNestor('c1', tensor, typeInfo);
  const child2 = createNestor('c2', tensor, typeInfo, [grandchild]);
  const parent = createNestor('p', tensor, typeInfo, [child1, child2]);

  passed = assert(nestorDepth(parent) === 3, 'Tree depth = 3') && passed;
  passed = assert(nestorNodeCount(parent) === 4, 'Tree node count = 4') && passed;

  return passed;
}

function testTraverseNestor(): boolean {
  logTest('traverseNestor');
  let passed = true;

  const typeInfo = createTestNestorType();
  const tensor = fromVector('t', 'i', [1, 2, 3]);
  const child = createNestor('child', tensor, typeInfo);
  const parent = createNestor('parent', tensor, typeInfo, [child]);

  const visited: string[] = [];
  const depths: number[] = [];
  traverseNestor(parent, (n, d) => {
    visited.push(n.id);
    depths.push(d);
  });

  passed = assert(visited.length === 2, 'Visited 2 nodes') && passed;
  passed = assert(visited[0] === 'parent', 'First visited is parent') && passed;
  passed = assert(visited[1] === 'child', 'Second visited is child') && passed;
  passed = assert(depths[0] === 0, 'Parent depth = 0') && passed;
  passed = assert(depths[1] === 1, 'Child depth = 1') && passed;

  return passed;
}

function testMapNestorTensors(): boolean {
  logTest('mapNestorTensors');
  let passed = true;

  const typeInfo = createTestNestorType();
  const tensor = fromVector('t', 'i', [1, 2, 3]);
  const child = createNestor('child', tensor, typeInfo);
  const parent = createNestor('parent', tensor, typeInfo, [child]);

  const doubled = mapNestorTensors(parent, (t) => scale(t, 2));

  passed = assertClose(doubled.tensor.data[0], 2, 'Parent tensor doubled') && passed;
  passed = assertClose(doubled.children[0].tensor.data[0], 2, 'Child tensor doubled') && passed;

  return passed;
}

function testAggregateNestor(): boolean {
  logTest('aggregateNestor');
  let passed = true;

  const typeInfo = createTestNestorType();
  const tensor1 = fromVector('t1', 'i', [1, 1, 1]);
  const tensor2 = fromVector('t2', 'i', [2, 2, 2]);
  const child = createNestor('child', tensor2, typeInfo);
  const parent = createNestor('parent', tensor1, typeInfo, [child]);

  const aggregated = aggregateNestor(parent, (current, children) => {
    if (children.length === 0) return current;
    return add(current, ...children);
  });

  passed = assertClose(aggregated.data[0], 3, 'Aggregated [0] = 1 + 2') && passed;

  return passed;
}

function testGaugeConnection(): boolean {
  logTest('createGaugeConnection / parallelTransport');
  let passed = true;

  const connectionForm = fromMatrix('A', ['i', 'j'], [[1, 0], [0, 1]]);
  const connection = createGaugeConnection(connectionForm, true);

  passed = assert(connection.connectionForm !== undefined, 'Connection form exists') && passed;
  passed = assert(connection.curvature !== undefined, 'Curvature computed') && passed;
  passed = assert(typeof connection.covariantDerivative === 'function', 'Covariant derivative is function') && passed;

  const tensor = fromVector('t', 'i', [1, 2]);
  const path = fromVector('p', 'j', [0.1, 0.2]);
  const transported = parallelTransport(tensor, connection, path);
  passed = assert(transported.data.length === 2, 'Transported tensor has correct size') && passed;

  return passed;
}

function testNestorMorphisms(): boolean {
  logTest('identityMorphism / createNestorMorphism / composeMorphisms');
  let passed = true;

  const typeInfo = createTestNestorType();
  const tensor = fromVector('t', 'i', [1, 2, 3]);
  const nestor1 = createNestor('n1', tensor, typeInfo);
  const nestor2 = createNestor('n2', tensor, typeInfo);
  const nestor3 = createNestor('n3', tensor, typeInfo);

  // Identity morphism
  const identity = identityMorphism(nestor1);
  passed = assert(identity.source.id === nestor1.id, 'Identity source is nestor1') && passed;
  passed = assert(identity.target.id === nestor1.id, 'Identity target is nestor1') && passed;
  const transformed = identity.transform(tensor);
  passed = assertClose(transformed.data[0], 1, 'Identity preserves data') && passed;

  // Custom morphism
  const doubler = createNestorMorphism(nestor1, nestor2, (t) => scale(t, 2));
  passed = assert(doubler.source.id === 'n1', 'Doubler source is n1') && passed;
  passed = assert(doubler.target.id === 'n2', 'Doubler target is n2') && passed;
  const doubled = doubler.transform(tensor);
  passed = assertClose(doubled.data[0], 2, 'Doubler doubles') && passed;

  // Composition
  const tripler = createNestorMorphism(nestor2, nestor3, (t) => scale(t, 3));
  const composed = composeMorphisms(doubler, tripler);
  passed = assert(composed.source.id === 'n1', 'Composed source is n1') && passed;
  passed = assert(composed.target.id === 'n3', 'Composed target is n3') && passed;
  const composedResult = composed.transform(tensor);
  passed = assertClose(composedResult.data[0], 6, 'Composed result: 1 * 2 * 3 = 6') && passed;

  // Composition error
  const badMorphism = createNestorMorphism(nestor3, nestor1, (t) => t);
  passed = assertThrows(() => composeMorphisms(doubler, badMorphism), 'Composing incompatible morphisms throws') && passed;

  return passed;
}

function testIsStructurePreserving(): boolean {
  logTest('isStructurePreserving');
  let passed = true;

  const typeInfo = createTestNestorType();
  const tensor = fromVector('t', 'i', [1, 2, 3]);
  const child = createNestor('child', tensor, typeInfo);
  const parent = createNestor('parent', tensor, typeInfo, [child]);
  const single = createNestor('single', tensor, typeInfo);

  // Same structure
  const parent2 = createNestor('parent2', tensor, typeInfo, [child]);
  const morphism1 = createNestorMorphism(parent, parent2, (t) => t);
  passed = assert(isStructurePreserving(morphism1), 'Same structure is preserving') && passed;

  // Different child count
  const morphism2 = createNestorMorphism(parent, single, (t) => t);
  passed = assert(!isStructurePreserving(morphism2), 'Different child count not preserving') && passed;

  // Different type
  const differentType: NestorType = { ...typeInfo, nodeType: 'different' };
  const different = createNestor('diff', tensor, differentType);
  const morphism3 = createNestorMorphism(single, different, (t) => t);
  passed = assert(!isStructurePreserving(morphism3), 'Different type not preserving') && passed;

  return passed;
}

function testGaugeTransform(): boolean {
  logTest('gaugeTransform');
  let passed = true;

  const typeInfo = createTestNestorType();
  const tensor = fromVector('t', 'i', [1, 2, 3]);
  const fiber = createFiberBundle('n1', 3);
  const nestor = attachFiberBundle(createNestor('n1', tensor, typeInfo), fiber);

  const transformed = gaugeTransform(nestor, (f) => ({
    ...f,
    fiberDim: f.fiberDim * 2,
  }));

  passed = assert(transformed.fiber !== undefined, 'Transformed has fiber') && passed;
  passed = assert(transformed.fiber!.fiberDim === 6, 'Fiber dim doubled') && passed;

  return passed;
}

function testComputeNestorGradient(): boolean {
  logTest('computeNestorGradient');
  let passed = true;

  const typeInfo = createTestNestorType();
  const tensor = fromVector('t', 'i', [1, 2, 3]);
  const nestor = createNestor('n1', tensor, typeInfo);

  const loss = (t: Tensor) => t.data.reduce((sum, v) => sum + v * v, 0);
  const gradients = computeNestorGradient(nestor, loss);

  passed = assert(gradients.has('n1'), 'Gradient computed for n1') && passed;
  const grad = gradients.get('n1')!;
  // Gradient of x^2 is 2x, so gradient at [1,2,3] should be approximately [2,4,6]
  passed = assert(Math.abs(grad.data[0] - 2) < 0.1, 'Gradient [0] ≈ 2') && passed;

  return passed;
}

// ============================================================================
// NEURAL-NESTOR-MORPH.TS TESTS
// ============================================================================

function testCreateNeuralNestor(): boolean {
  logTest('createNeuralNestor');
  let passed = true;

  const tensor = fromVector('t', 'i', [1, 2, 3]);
  const typeInfo = createTestNestorType();
  const nn = createNeuralNestor('nn1', tensor, typeInfo, relu, true);

  passed = assert(nn.id === 'nn1', 'NeuralNestor has correct id') && passed;
  passed = assert(nn.trainable === true, 'NeuralNestor is trainable') && passed;
  passed = assert(nn.activation !== undefined, 'NeuralNestor has activation') && passed;
  passed = assert(nn.weights !== undefined, 'NeuralNestor has weights map') && passed;
  passed = assert(nn.biases !== undefined, 'NeuralNestor has biases map') && passed;

  return passed;
}

function testNeuralNestorForward(): boolean {
  logTest('neuralNestorForward');
  let passed = true;

  const typeInfo = createTestNestorType();
  const tensor = fromVector('t', 'o', [0, 0, 0]);
  const nn = createNeuralNestor('nn', tensor, typeInfo, relu, true);

  // Add simple weight and bias
  nn.weights!.set('W', fromMatrix('W', ['i', 'o'], [[1, 0, 0], [0, 1, 0], [0, 0, 1]]));
  nn.biases!.set('b', fromVector('b', 'o', [1, 2, 3]));

  const input = fromVector('input', 'i', [1, 1, 1]);
  const output = neuralNestorForward(nn, input);

  // With identity weight and bias [1,2,3], input [1,1,1] -> [2,3,4] after relu
  passed = assert(output.data.length > 0, 'Forward produces output') && passed;

  return passed;
}

function testFiberForest(): boolean {
  logTest('createFiberForest / embedNestorInForest');
  let passed = true;

  const typeInfo = createTestNestorType();
  const tensor = fromVector('t', 'i', [1, 2, 3]);
  const fiber = createFiberBundle('n1', 3);
  const nestor = attachFiberBundle(createNestor('n1', tensor, typeInfo), fiber);

  const forest = createFiberForest([nestor], 16);
  passed = assert(forest.roots.length === 1, 'Forest has 1 root') && passed;
  passed = assert(forest.embeddingDim === 16, 'Forest embedding dim = 16') && passed;

  const embedding = embedNestorInForest(nestor, forest);
  passed = assert(embedding.shape[0] === 16, 'Embedding has dim 16') && passed;

  return passed;
}

function testGaugeTransformer(): boolean {
  logTest('createGaugeTransformer / gaugeTransformerAttention');
  let passed = true;

  const transformer = createGaugeTransformer(4, 8, 32);
  passed = assert(transformer.numHeads === 4, 'Transformer has 4 heads') && passed;
  passed = assert(transformer.headDim === 8, 'Head dim = 8') && passed;
  passed = assert(transformer.projections.query.shape[1] === 32, 'Query projection size') && passed;

  const typeInfo = createTestNestorType();
  const nestors = [
    createNestor('n1', fromVector('t1', 'm', Array(32).fill(0).map(() => Math.random())), typeInfo),
    createNestor('n2', fromVector('t2', 'm', Array(32).fill(0).map(() => Math.random())), typeInfo),
  ];

  const attended = gaugeTransformerAttention(transformer, nestors);
  passed = assert(attended.length === 2, 'Attention produces 2 outputs') && passed;
  passed = assert(attended[0].data.length > 0, 'Attention output has data') && passed;

  return passed;
}

function testCategoricalContext(): boolean {
  logTest('createCategoricalContext / addObject / addMorphism / composeInContext');
  let passed = true;

  const context = createCategoricalContext();
  passed = assert(context.objects.size === 0, 'New context has no objects') && passed;

  const typeInfo = createTestNestorType();
  const tensor = fromVector('t', 'i', [1, 2, 3]);
  const n1 = createNestor('n1', tensor, typeInfo);
  const n2 = createNestor('n2', tensor, typeInfo);
  const n3 = createNestor('n3', tensor, typeInfo);

  addObject(context, n1);
  addObject(context, n2);
  passed = assert(context.objects.size === 2, 'Context has 2 objects') && passed;
  passed = assert(context.morphisms.has('id_n1'), 'Identity morphism for n1 added') && passed;

  const f = createNestorMorphism(n1, n2, (t) => scale(t, 2));
  const g = createNestorMorphism(n2, n3, (t) => scale(t, 3));
  addMorphism(context, 'f', f);
  addMorphism(context, 'g', g);

  const composed = composeInContext(context, 'f', 'g');
  passed = assert(composed.source.id === 'n1', 'Composed source is n1') && passed;
  passed = assert(composed.target.id === 'n3', 'Composed target is n3') && passed;

  // Cached
  const cached = composeInContext(context, 'f', 'g');
  passed = assert(cached === composed, 'Composition is cached') && passed;

  // Error on missing morphism
  passed = assertThrows(() => composeInContext(context, 'f', 'missing'), 'Missing morphism throws') && passed;

  return passed;
}

function testFunctors(): boolean {
  logTest('addFunctor / createEmbeddingFunctor / applyFunctor');
  let passed = true;

  const typeInfo = createTestNestorType();
  const tensor = fromVector('t', 'i', [1, 2, 3]);
  const fiber = createFiberBundle('n1', 3);
  const nestor = attachFiberBundle(createNestor('n1', tensor, typeInfo), fiber);

  const forest = createFiberForest([nestor], 16);
  const functor = createEmbeddingFunctor(forest);
  passed = assert(functor.name === 'EmbeddingFunctor', 'Functor has correct name') && passed;

  const embedded = applyFunctor(functor, nestor);
  passed = assert(embedded.id.includes('embedded'), 'Embedded nestor has embedded in id') && passed;
  passed = assert(embedded.tensor.shape[0] === 16, 'Embedded tensor has dim 16') && passed;

  const context = createCategoricalContext();
  addFunctor(context, functor);
  passed = assert(context.functors.has('EmbeddingFunctor'), 'Functor added to context') && passed;

  return passed;
}

function testTypedHyperGraphNN(): boolean {
  logTest('createTypedHyperGraphNN / neuralNestorMorphForward');
  let passed = true;

  const typeInfo = createTestNestorType();
  const tensor = fromVector('t', 'i', [1, 2, 3]);
  const fiber = createFiberBundle('n1', 3);
  const nestor = attachFiberBundle(createNestor('n1', tensor, typeInfo), fiber);

  const forest = createFiberForest([nestor], 16);
  const network = createTypedHyperGraphNN(forest, 32, 8);

  passed = assert(network.encoder.numHeads === 4, 'Encoder has 4 heads') && passed;
  passed = assert(network.decoder.trainable === true, 'Decoder is trainable') && passed;
  passed = assert(network.context.objects.size >= 1, 'Context has objects') && passed;

  const output = neuralNestorMorphForward(network, [nestor]);
  passed = assert(output.shape[0] === 8, 'Output has correct dimension') && passed;

  return passed;
}

// ============================================================================
// UTILS.TS TESTS
// ============================================================================

function testBroadcastAdd(): boolean {
  logTest('broadcastAdd');
  let passed = true;

  const tensor = fromMatrix('T', ['i', 'j'], [[1, 2, 3], [4, 5, 6]]);
  const bias = fromVector('b', 'j', [10, 20, 30]);

  const result = broadcastAdd(tensor, bias);
  passed = assertClose(getElement(result, 0, 0), 11, 'Result[0,0] = 1 + 10') && passed;
  passed = assertClose(getElement(result, 0, 2), 33, 'Result[0,2] = 3 + 30') && passed;
  passed = assertClose(getElement(result, 1, 1), 25, 'Result[1,1] = 5 + 20') && passed;

  // Test error on non-1D bias
  const badBias = fromMatrix('bad', ['i', 'j'], [[1, 2]]);
  passed = assertThrows(() => broadcastAdd(tensor, badBias), 'Non-1D bias throws') && passed;

  // Test error on dimension mismatch
  const wrongSize = fromVector('wrong', 'j', [1, 2]);
  passed = assertThrows(() => broadcastAdd(tensor, wrongSize), 'Size mismatch throws') && passed;

  return passed;
}

function testBroadcastMultiply(): boolean {
  logTest('broadcastMultiply');
  let passed = true;

  const tensor = fromMatrix('T', ['i', 'j'], [[1, 2, 3], [4, 5, 6]]);
  const weights = fromVector('w', 'j', [2, 3, 4]);

  const result = broadcastMultiply(tensor, weights);
  passed = assertClose(getElement(result, 0, 0), 2, 'Result[0,0] = 1 * 2') && passed;
  passed = assertClose(getElement(result, 0, 2), 12, 'Result[0,2] = 3 * 4') && passed;
  passed = assertClose(getElement(result, 1, 1), 15, 'Result[1,1] = 5 * 3') && passed;

  return passed;
}

function testExtractSlice(): boolean {
  logTest('extractSlice');
  let passed = true;

  const tensor = createTensor('T', ['i', 'j', 'k'], [2, 3, 4], 'zeros');
  // Fill with values i*100 + j*10 + k
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 3; j++) {
      for (let k = 0; k < 4; k++) {
        tensor.data[i * 12 + j * 4 + k] = i * 100 + j * 10 + k;
      }
    }
  }

  // Extract slice along dimension 1 (j=1)
  const slice = extractSlice(tensor, 1, 1);
  passed = assert(slice.shape.length === 2, 'Slice is 2D') && passed;
  passed = assert(slice.shape[0] === 2 && slice.shape[1] === 4, 'Slice shape is [2, 4]') && passed;
  passed = assertClose(getElement(slice, 0, 0), 10, 'Slice[0,0] = j=1 value for i=0,k=0') && passed;
  passed = assertClose(getElement(slice, 1, 3), 113, 'Slice[1,3] = j=1 value for i=1,k=3') && passed;

  // Test error on out of bounds
  passed = assertThrows(() => extractSlice(tensor, 1, 5), 'Out of bounds throws') && passed;

  return passed;
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllUnitTests() {
  log('\n' + '═'.repeat(70), colors.cyan);
  log('  EXHAUSTIVE UNIT TEST SUITE', colors.cyan);
  log('  Neural Nestor Gauge Logic Framework', colors.cyan);
  log('═'.repeat(70), colors.cyan);

  const modules: { name: string; tests: Array<{ name: string; fn: () => boolean }> }[] = [
    {
      name: 'CORE.TS - Tensor Operations',
      tests: [
        { name: 'createTensor', fn: testCreateTensor },
        { name: 'fromMatrix', fn: testFromMatrix },
        { name: 'fromVector', fn: testFromVector },
        { name: 'getElement / setElement', fn: testGetSetElement },
        { name: 'einsum', fn: testEinsum },
        { name: 'threshold', fn: testThreshold },
        { name: 'sigmoid', fn: testSigmoid },
        { name: 'relu', fn: testRelu },
        { name: 'softmax', fn: testSoftmax },
        { name: 'add / multiply / scale', fn: testAddMultiplyScale },
        { name: 'transpose', fn: testTranspose },
        { name: 'tensorToString', fn: testTensorToString },
        { name: 'clone', fn: testClone },
        { name: 'identity', fn: testIdentity },
      ],
    },
    {
      name: 'NESTOR.TS - Nestor Structures',
      tests: [
        { name: 'createNestor', fn: testCreateNestor },
        { name: 'createFiberBundle / attachFiberBundle', fn: testFiberBundle },
        { name: 'nestorDepth / nestorNodeCount', fn: testNestorDepthAndCount },
        { name: 'traverseNestor', fn: testTraverseNestor },
        { name: 'mapNestorTensors', fn: testMapNestorTensors },
        { name: 'aggregateNestor', fn: testAggregateNestor },
        { name: 'createGaugeConnection / parallelTransport', fn: testGaugeConnection },
        { name: 'identityMorphism / composeMorphisms', fn: testNestorMorphisms },
        { name: 'isStructurePreserving', fn: testIsStructurePreserving },
        { name: 'gaugeTransform', fn: testGaugeTransform },
        { name: 'computeNestorGradient', fn: testComputeNestorGradient },
      ],
    },
    {
      name: 'NEURAL-NESTOR-MORPH.TS - Neural Networks',
      tests: [
        { name: 'createNeuralNestor', fn: testCreateNeuralNestor },
        { name: 'neuralNestorForward', fn: testNeuralNestorForward },
        { name: 'createFiberForest / embedNestorInForest', fn: testFiberForest },
        { name: 'createGaugeTransformer / gaugeTransformerAttention', fn: testGaugeTransformer },
        { name: 'CategoricalContext operations', fn: testCategoricalContext },
        { name: 'Functors', fn: testFunctors },
        { name: 'createTypedHyperGraphNN / neuralNestorMorphForward', fn: testTypedHyperGraphNN },
      ],
    },
    {
      name: 'UTILS.TS - Utility Functions',
      tests: [
        { name: 'broadcastAdd', fn: testBroadcastAdd },
        { name: 'broadcastMultiply', fn: testBroadcastMultiply },
        { name: 'extractSlice', fn: testExtractSlice },
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
    log('  ALL UNIT TESTS PASSED!', colors.green);
  } else {
    log('  SOME TESTS FAILED - Review above for details', colors.red);
  }
  log('═'.repeat(70) + '\n', colors.cyan);

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runAllUnitTests();
