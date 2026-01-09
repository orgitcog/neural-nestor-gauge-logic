#!/usr/bin/env tsx

/**
 * Test and validation script for Neural Nestor Gauge Logic framework
 * 
 * This script validates that the framework is working correctly by:
 * 1. Creating Nestors with fiber bundles
 * 2. Building a hypertree structure
 * 3. Computing embeddings
 * 4. Running forward pass through the network
 * 5. Verifying categorical properties
 */

import {
  createTensor,
  fromVector,
  tensorToString,
} from '../src/tensor-logic/core.js';

import {
  Nestor,
  NestorType,
  createNestor,
  createFiberBundle,
  attachFiberBundle,
  createGaugeConnection,
  parallelTransport,
  nestorDepth,
  nestorNodeCount,
  mapNestorTensors,
  identityMorphism,
  composeMorphisms,
  createNestorMorphism,
} from '../src/tensor-logic/nestor.js';

import {
  createFiberForest,
  embedNestorInForest,
  createTypedHyperGraphNN,
  neuralNestorMorphForward,
  createCategoricalContext,
  addObject,
  addMorphism,
  composeInContext,
  createEmbeddingFunctor,
  applyFunctor,
} from '../src/tensor-logic/neural-nestor-morph.js';

import { runNeuralNestorMorphExample } from '../src/tensor-logic/examples/neural-nestor-morph.js';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
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

function assert(condition: boolean, message: string) {
  if (condition) {
    logSuccess(message);
  } else {
    logError(message);
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Test 1: Basic Nestor creation
function testNestorCreation() {
  logTest('Test 1: Basic Nestor Creation');
  
  const personType: NestorType = {
    nodeType: 'Person',
    edgeTypes: ['worksIn'],
    signature: {
      inputShape: [3],
      outputShape: [3],
      indices: ['p'],
    },
  };
  
  const alice = createNestor(
    'alice',
    fromVector('alice_features', 'p', [0.8, 0.9, 0.7]),
    personType
  );
  
  assert(alice.id === 'alice', 'Nestor has correct ID');
  assert(alice.tensor.shape[0] === 3, 'Tensor has correct shape');
  assert(alice.children.length === 0, 'Leaf node has no children');
  assert(nestorDepth(alice) === 1, 'Depth of leaf node is 1');
  assert(nestorNodeCount(alice) === 1, 'Node count is 1');
}

// Test 2: Fiber bundle attachment
function testFiberBundles() {
  logTest('Test 2: Fiber Bundle Attachment');
  
  const personType: NestorType = {
    nodeType: 'Person',
    edgeTypes: [],
    signature: { inputShape: [3], outputShape: [3], indices: ['p'] },
  };
  
  const alice = createNestor(
    'alice',
    fromVector('alice_features', 'p', [0.8, 0.9, 0.7]),
    personType
  );
  
  const fiber = createFiberBundle('alice', 3);
  const aliceWithFiber = attachFiberBundle(alice, fiber);
  
  assert(aliceWithFiber.fiber !== undefined, 'Fiber bundle attached');
  assert(aliceWithFiber.fiber!.baseId === 'alice', 'Fiber has correct base ID');
  assert(aliceWithFiber.fiber!.fiberDim === 3, 'Fiber has correct dimension');
}

// Test 3: Hypertree structure
function testHypertree() {
  logTest('Test 3: Hypertree Structure');
  
  const personType: NestorType = {
    nodeType: 'Person',
    edgeTypes: [],
    signature: { inputShape: [3], outputShape: [3], indices: ['p'] },
  };
  
  const teamType: NestorType = {
    nodeType: 'Team',
    edgeTypes: ['hasMember'],
    signature: { inputShape: [5], outputShape: [5], indices: ['t'] },
  };
  
  const alice = createNestor('alice', fromVector('alice', 'p', [0.8, 0.9, 0.7]), personType);
  const bob = createNestor('bob', fromVector('bob', 'p', [0.6, 0.8, 0.9]), personType);
  
  const team = createNestor(
    'team',
    fromVector('team', 't', [0.9, 0.8, 0.85, 0.9, 0.88]),
    teamType,
    [alice, bob]
  );
  
  assert(team.children.length === 2, 'Team has 2 children');
  assert(nestorDepth(team) === 2, 'Hypertree depth is 2');
  assert(nestorNodeCount(team) === 3, 'Total node count is 3');
}

// Test 4: Gauge connections
function testGaugeConnections() {
  logTest('Test 4: Gauge Connections');
  
  const connectionForm = createTensor('connection', ['i', 'j'], [3, 3], 'random');
  const connection = createGaugeConnection(connectionForm, true);
  
  assert(connection.connectionForm !== undefined, 'Connection form created');
  assert(connection.curvature !== undefined, 'Curvature computed');
  assert(typeof connection.covariantDerivative === 'function', 'Covariant derivative is a function');
  
  // Test parallel transport
  const tensor = fromVector('test', 't', [1, 2, 3]);
  const path = fromVector('path', 'p', [0.1, 0.2, 0.3]);
  const transported = parallelTransport(tensor, connection, path);
  
  assert(transported.shape[0] === 3, 'Parallel transport preserves dimension');
}

// Test 5: Categorical morphisms
function testCategoricalMorphisms() {
  logTest('Test 5: Categorical Morphisms');
  
  const personType: NestorType = {
    nodeType: 'Person',
    edgeTypes: [],
    signature: { inputShape: [3], outputShape: [3], indices: ['p'] },
  };
  
  const alice = createNestor('alice', fromVector('alice', 'p', [0.8, 0.9, 0.7]), personType);
  const bob = createNestor('bob', fromVector('bob', 'p', [0.6, 0.8, 0.9]), personType);
  const charlie = createNestor('charlie', fromVector('charlie', 'p', [0.9, 0.7, 0.8]), personType);
  
  // Test identity morphism
  const idAlice = identityMorphism(alice);
  assert(idAlice.source.id === alice.id, 'Identity morphism has correct source');
  assert(idAlice.target.id === alice.id, 'Identity morphism has correct target');
  
  // Test morphism composition
  const f = createNestorMorphism(alice, bob, (t) => t);
  const g = createNestorMorphism(bob, charlie, (t) => t);
  const h = composeMorphisms(f, g);
  
  assert(h.source.id === alice.id, 'Composed morphism has correct source');
  assert(h.target.id === charlie.id, 'Composed morphism has correct target');
}

// Test 6: Fiber forest and embeddings
function testFiberForest() {
  logTest('Test 6: Fiber Forest and Embeddings');
  
  const personType: NestorType = {
    nodeType: 'Person',
    edgeTypes: [],
    signature: { inputShape: [3], outputShape: [3], indices: ['p'] },
  };
  
  const alice = createNestor('alice', fromVector('alice', 'p', [0.8, 0.9, 0.7]), personType);
  const fiber = createFiberBundle('alice', 3);
  const aliceWithFiber = attachFiberBundle(alice, fiber);
  
  const forest = createFiberForest([aliceWithFiber], 16);
  
  assert(forest.roots.length === 1, 'Forest has 1 root');
  assert(forest.embeddingDim === 16, 'Forest has correct embedding dimension');
  
  const embedding = embedNestorInForest(aliceWithFiber, forest);
  
  assert(embedding.shape[0] === 16, 'Embedding has correct dimension');
}

// Test 7: Typed hyper-graph neural network
function testTypedHyperGraphNN() {
  logTest('Test 7: Typed Hyper-Graph Neural Network');
  
  const personType: NestorType = {
    nodeType: 'Person',
    edgeTypes: [],
    signature: { inputShape: [3], outputShape: [3], indices: ['p'] },
  };
  
  const alice = createNestor('alice', fromVector('alice', 'p', [0.8, 0.9, 0.7]), personType);
  const bob = createNestor('bob', fromVector('bob', 'p', [0.6, 0.8, 0.9]), personType);
  
  const fiber1 = createFiberBundle('alice', 3);
  const fiber2 = createFiberBundle('bob', 3);
  
  const aliceWithFiber = attachFiberBundle(alice, fiber1);
  const bobWithFiber = attachFiberBundle(bob, fiber2);
  
  const forest = createFiberForest([aliceWithFiber, bobWithFiber], 16);
  const network = createTypedHyperGraphNN(forest, 32, 8);
  
  assert(network.encoder.numHeads === 4, 'Encoder has 4 attention heads');
  assert(network.decoder.trainable === true, 'Decoder is trainable');
  assert(network.context.objects.size >= 1, 'Categorical context has objects');
  
  // Test forward pass
  const output = neuralNestorMorphForward(network, [aliceWithFiber, bobWithFiber]);
  
  assert(output.shape[0] === 8, 'Output has correct dimension');
}

// Test 8: Categorical context operations
function testCategoricalContext() {
  logTest('Test 8: Categorical Context Operations');
  
  const personType: NestorType = {
    nodeType: 'Person',
    edgeTypes: [],
    signature: { inputShape: [3], outputShape: [3], indices: ['p'] },
  };
  
  const alice = createNestor('alice', fromVector('alice', 'p', [0.8, 0.9, 0.7]), personType);
  const bob = createNestor('bob', fromVector('bob', 'p', [0.6, 0.8, 0.9]), personType);
  
  const context = createCategoricalContext();
  addObject(context, alice);
  addObject(context, bob);
  
  assert(context.objects.size === 2, 'Context has 2 objects');
  assert(context.morphisms.has('id_alice'), 'Context has identity morphism for alice');
  assert(context.morphisms.has('id_bob'), 'Context has identity morphism for bob');
  
  // Add a custom morphism
  const f = createNestorMorphism(alice, bob, (t) => t);
  addMorphism(context, 'f', f);
  
  assert(context.morphisms.has('f'), 'Context has custom morphism');
  
  // Test composition
  const g = createNestorMorphism(bob, alice, (t) => t);
  addMorphism(context, 'g', g);
  
  const composed = composeInContext(context, 'f', 'g');
  assert(composed.source.id === alice.id, 'Composed morphism has correct source');
}

// Test 9: Functors
function testFunctors() {
  logTest('Test 9: Functors');
  
  const personType: NestorType = {
    nodeType: 'Person',
    edgeTypes: [],
    signature: { inputShape: [3], outputShape: [3], indices: ['p'] },
  };
  
  const alice = createNestor('alice', fromVector('alice', 'p', [0.8, 0.9, 0.7]), personType);
  const fiber = createFiberBundle('alice', 3);
  const aliceWithFiber = attachFiberBundle(alice, fiber);
  
  const forest = createFiberForest([aliceWithFiber], 16);
  const embeddingFunctor = createEmbeddingFunctor(forest);
  
  assert(embeddingFunctor.name === 'EmbeddingFunctor', 'Functor has correct name');
  
  const embedded = applyFunctor(embeddingFunctor, aliceWithFiber);
  
  assert(embedded.id.includes('embedded'), 'Functor transforms object ID');
  assert(embedded.tensor.shape[0] === 16, 'Functor produces correct embedding dimension');
}

// Test 10: Complete example
function testCompleteExample() {
  logTest('Test 10: Complete Neural Nestor Morph Example');
  
  const result = runNeuralNestorMorphExample();
  
  assert(result.title === 'Neural Nestor Morph Logic', 'Example has correct title');
  assert(result.steps.length > 0, 'Example produces steps');
  assert(result.steps.some(s => s.name.includes('Hierarchical')), 'Example shows hierarchical structure');
  assert(result.steps.some(s => s.name.includes('Fiber')), 'Example shows fiber bundles');
  assert(result.steps.some(s => s.name.includes('Embedding')), 'Example shows embeddings');
  assert(result.steps.some(s => s.name.includes('Network')), 'Example shows network');
  
  logSuccess(`Example produced ${result.steps.length} steps`);
}

// Run all tests
async function runAllTests() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('Neural Nestor Gauge Logic - Test Suite', colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);
  
  const tests = [
    testNestorCreation,
    testFiberBundles,
    testHypertree,
    testGaugeConnections,
    testCategoricalMorphisms,
    testFiberForest,
    testTypedHyperGraphNN,
    testCategoricalContext,
    testFunctors,
    testCompleteExample,
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      test();
      passed++;
    } catch (error) {
      failed++;
      logError(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  log('\n' + '='.repeat(60), colors.cyan);
  log(`Results: ${passed} passed, ${failed} failed`, colors.cyan);
  log('='.repeat(60) + '\n', colors.cyan);
  
  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
