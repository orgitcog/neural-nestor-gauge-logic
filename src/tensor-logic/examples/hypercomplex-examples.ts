/**
 * HYPERCOMPLEX TENSOR LOGIC EXAMPLES
 * 
 * Demonstrates different hypercomplex number systems in AI/ML contexts:
 * 1. Complex-valued Fourier Neural Network
 * 2. Quaternion-valued 3D Rotation Network
 * 3. Octonion-valued Context-Sensitive Reasoning
 * 4. Sedenion-valued Over-Parameterized System
 */

import {
  Complex,
  Quaternion,
  Octonion,
  complex,
  quaternion,
  octonion,
} from '../hypercomplex';

import {
  createComplexTensor,
  createQuaternionTensor,
  createHypercomplexTensor,
  hypercomplexEinsum,
  complexReLU,
  quaternionReLU,
  splitActivation,
  extractRealParts,
  hypercomplexTensorToString,
} from '../hypercomplex-tensor';

import { AlgebraType } from '../hypercomplex';

// ============================================================================
// EXAMPLE 1: COMPLEX-VALUED FOURIER NEURAL NETWORK
// ============================================================================

/**
 * Complex-valued neural networks are natural for signal processing,
 * quantum computing, and tasks involving phase information.
 * 
 * Key advantage: Can represent both amplitude AND phase
 */
export function complexFourierNetwork() {
  console.log('\n' + '='.repeat(70));
  console.log('COMPLEX-VALUED FOURIER NEURAL NETWORK');
  console.log('='.repeat(70));
  console.log('Use case: Quantum-inspired AI, signal processing, holographic representations');
  console.log();

  // Input: Complex-valued features (amplitude + phase)
  // Represents signal with both magnitude and phase information
  const input = createComplexTensor(
    'input',
    ['i'],
    [3],
    [
      complex(1.0, 0.0),   // Pure real
      complex(0.0, 1.0),   // Pure imaginary (π/2 phase shift)
      complex(0.707, 0.707), // 45° phase
    ]
  );

  console.log('Input (complex signal):');
  console.log(hypercomplexTensorToString(input));
  console.log();

  // Weights: Complex-valued weight matrix
  // Can learn both magnitude scaling and phase shifts
  const weights = createComplexTensor(
    'weights',
    ['o', 'i'],
    [2, 3],
    [
      complex(0.5, 0.5),   complex(-0.3, 0.7),  complex(0.4, -0.2),
      complex(0.6, -0.4),  complex(0.2, 0.8),   complex(-0.5, 0.3),
    ]
  );

  console.log('Weights (complex transformations):');
  console.log(hypercomplexTensorToString(weights));
  console.log();

  // Matrix multiplication: o = W · x (in complex domain)
  const output = hypercomplexEinsum('oi,i->o', weights, input);

  console.log('Output (complex activations):');
  console.log(hypercomplexTensorToString(output));
  console.log();

  // Complex ReLU activation
  const activated = complexReLU(output);

  console.log('After complex ReLU:');
  console.log(hypercomplexTensorToString(activated));
  console.log();

  // Extract magnitude for classification
  const magnitudes = extractRealParts(output);
  console.log('Output magnitudes:', Array.from(magnitudes).map(x => x.toFixed(3)));
  console.log();

  console.log('Interpretation:');
  console.log('- Complex networks preserve phase information');
  console.log('- Natural for Fourier transforms and frequency domain');
  console.log('- Used in radar, MRI, quantum neural networks');
  console.log();

  return output;
}

// ============================================================================
// EXAMPLE 2: QUATERNION-VALUED 3D ROTATION NETWORK
// ============================================================================

/**
 * Quaternion neural networks are ideal for 3D geometry tasks.
 * 
 * Key advantage: Represent 3D rotations without gimbal lock
 */
export function quaternion3DRotationNetwork() {
  console.log('\n' + '='.repeat(70));
  console.log('QUATERNION-VALUED 3D ROTATION NETWORK');
  console.log('='.repeat(70));
  console.log('Use case: 3D computer vision, robotics, molecular modeling');
  console.log();

  // Input: Quaternions representing 3D orientations
  // Each quaternion encodes a rotation in 3D space
  const input = createQuaternionTensor(
    'orientations',
    ['b'],  // batch dimension
    [2],
    [
      quaternion(1, 0, 0, 0),      // Identity (no rotation)
      quaternion(0.707, 0.707, 0, 0), // 90° rotation around X-axis
    ]
  );

  console.log('Input (3D orientations as quaternions):');
  for (let i = 0; i < 2; i++) {
    const q = input.data[i] as Quaternion;
    console.log(`  Object ${i}: ${q.toString()}`);
    console.log(`    Rotation matrix:`);
    const R = q.toRotationMatrix();
    R.forEach(row => console.log(`      [${row.map(x => x.toFixed(3)).join(', ')}]`));
  }
  console.log();

  // Weights: Quaternion transformations
  // Each weight represents a learned 3D rotation + scaling
  const weights = createQuaternionTensor(
    'transforms',
    ['o', 'b'],
    [2, 2],
    [
      quaternion(0.9, 0.1, 0.3, 0.2),
      quaternion(0.8, 0.4, 0.2, 0.3),
      quaternion(0.7, 0.3, 0.5, 0.1),
      quaternion(0.85, 0.2, 0.1, 0.4),
    ]
  );

  // Quaternion matrix multiplication
  const output = hypercomplexEinsum('ob,b->o', weights, input);

  console.log('Output (transformed orientations):');
  console.log(hypercomplexTensorToString(output));
  console.log();

  console.log('Interpretation:');
  console.log('- Quaternion multiplication = composition of 3D rotations');
  console.log('- Non-commutative: order matters (just like real rotations!)');
  console.log('- Avoids gimbal lock problem of Euler angles');
  console.log('- Used in: robotics, 3D pose estimation, protein structure');
  console.log();

  return output;
}

// ============================================================================
// EXAMPLE 3: OCTONION-VALUED CONTEXT-SENSITIVE REASONING
// ============================================================================

/**
 * Octonions are non-associative: (ab)c ≠ a(bc)
 * This matches situations where order of operations matters!
 * 
 * Key advantage: Model context-sensitive, order-dependent reasoning
 */
export function octonionContextSensitiveReasoning() {
  console.log('\n' + '='.repeat(70));
  console.log('OCTONION-VALUED CONTEXT-SENSITIVE REASONING');
  console.log('='.repeat(70));
  console.log('Use case: Non-associative logic, compositional semantics, syntax-aware NLP');
  console.log();

  // Example: Parsing where bracketing matters
  // (A + B) × C  vs  A + (B × C)
  
  const A = octonion(1, 0, 0, 0, 0, 0, 0, 0);
  const B = octonion(0, 1, 0, 0, 0, 0, 0, 0);
  const C = octonion(0, 0, 1, 0, 0, 0, 0, 0);

  console.log('Consider three operations A, B, C (as octonions)');
  console.log(`A = ${A.toString()}`);
  console.log(`B = ${B.toString()}`);
  console.log(`C = ${C.toString()}`);
  console.log();

  // Different bracketing gives different results!
  const AB_C = A.multiply(B).multiply(C);  // (A·B)·C
  const A_BC = A.multiply(B.multiply(C));  // A·(B·C)

  console.log('Due to non-associativity:');
  console.log(`(A·B)·C = ${AB_C.toString()}`);
  console.log(`A·(B·C) = ${A_BC.toString()}`);
  console.log();

  // Check if they're different
  const difference = AB_C.add(A_BC.scale(-1));
  const diffNorm = difference.norm();
  console.log(`Difference norm: ${diffNorm.toFixed(6)}`);
  
  if (diffNorm > 1e-10) {
    console.log('✓ These are DIFFERENT! Bracketing matters.');
  } else {
    console.log('✗ These happen to be the same for this example.');
  }
  console.log();

  console.log('Interpretation:');
  console.log('- Octonions capture non-associative composition');
  console.log('- Models situations where grouping/context matters');
  console.log('- Applications:');
  console.log('  * Natural language: syntax trees where structure matters');
  console.log('  * Sequential decisions: order of actions is critical');
  console.log('  * Physics: exceptional Lie groups, string theory');
  console.log();

  return { AB_C, A_BC };
}

// ============================================================================
// EXAMPLE 4: SEDENION-VALUED OVER-PARAMETERIZED SYSTEM
// ============================================================================

/**
 * Sedenions have zero divisors: xy = 0 even when x,y ≠ 0
 * This "pathological" property mirrors over-parameterized neural networks!
 * 
 * Key insight: Redundancy and degeneracy can still be useful
 */
export function sedenionOverParameterizedSystem() {
  console.log('\n' + '='.repeat(70));
  console.log('SEDENION-VALUED OVER-PARAMETERIZED SYSTEM');
  console.log('='.repeat(70));
  console.log('Use case: Understanding over-parameterization, redundant representations');
  console.log();

  // Create sedenion-valued tensor (16 dimensions per element)
  const tensor = createHypercomplexTensor(
    'sedenions',
    ['i'],
    [2],
    AlgebraType.Sedenion,
    'random'
  );

  console.log('Sedenion tensor (16-dimensional per element):');
  console.log(hypercomplexTensorToString(tensor));
  console.log();

  console.log('Key properties of sedenions:');
  console.log('- 16 dimensions: highly over-parameterized');
  console.log('- Has zero divisors: can have x·y = 0 with x,y ≠ 0');
  console.log('- Loses division algebra property');
  console.log();

  console.log('Analogy to over-parameterized neural networks:');
  console.log('- More parameters than needed (like sedenions having 16 dims)');
  console.log('- Multiple solutions/representations (like zero divisors)');
  console.log('- Degeneracies can still lead to good generalization');
  console.log('- Example: GPT-3 has 175B parameters for tasks solvable with fewer');
  console.log();

  console.log('Why study sedenions in AI?');
  console.log('- Understanding the loss landscape of over-parameterized nets');
  console.log('- Lottery ticket hypothesis: sparse sub-networks');
  console.log('- Double descent phenomenon');
  console.log('- Why over-parameterization helps generalization');
  console.log();

  return tensor;
}

// ============================================================================
// EXAMPLE 5: CAYLEY-DICKSON HIERARCHY - COMPARING ALL LEVELS
// ============================================================================

/**
 * Show the progression through the Cayley-Dickson construction
 */
export function cayleyDicksonHierarchy() {
  console.log('\n' + '='.repeat(70));
  console.log('CAYLEY-DICKSON HIERARCHY: ALGEBRA PROPERTIES vs AI PARADIGMS');
  console.log('='.repeat(70));
  console.log();

  const table = [
    ['Algebra', 'Dim', 'Ordered', 'Commute', 'Assoc', 'Division', 'AI Paradigm'],
    ['-'.repeat(10), '---', '-------', '-------', '-----', '--------', '-'.repeat(25)],
    ['Boolean', '1', '✓', '✓', '✓', 'N/A', 'Symbolic Logic'],
    ['Real', '1', '✓', '✓', '✓', '✓', 'Neural Networks'],
    ['Complex', '2', '✗', '✓', '✓', '✓', 'Quantum-Inspired AI'],
    ['Quaternion', '4', '✗', '✗', '✓', '✓', '3D Spatial Reasoning'],
    ['Octonion', '8', '✗', '✗', '✗', '✓*', 'Non-Associative Logic'],
    ['Sedenion', '16', '✗', '✗', '✗', '✗', 'Over-Parameterized'],
    ['Higher', '32+', '✗', '✗', '✗', '✗', 'Hyper-Dimensional'],
  ];

  table.forEach(row => {
    console.log(row.map((cell, i) => {
      const widths = [10, 3, 7, 7, 5, 8, 25];
      return cell.padEnd(widths[i]);
    }).join(' | '));
  });

  console.log();
  console.log('* Octonions are alternative: weaker than associative');
  console.log();

  console.log('Key Insight:');
  console.log('Each step LOSES algebraic structure but GAINS representational power!');
  console.log();
  console.log('Trade-off:');
  console.log('  More structure    <-->    More flexibility');
  console.log('  Symbolic AI       <-->    Neural Networks');
  console.log('  Exact reasoning   <-->    Approximate learning');
  console.log();
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

export function runAllHypercomplexExamples(): void {
  console.clear();
  console.log('╔' + '═'.repeat(70) + '╗');
  console.log('║' + ' '.repeat(15) + 'HYPERCOMPLEX TENSOR LOGIC EXAMPLES' + ' '.repeat(20) + '║');
  console.log('║' + ' '.repeat(10) + 'Extending Boolean/Real to Complex/Quaternion/...  ' + ' '.repeat(9) + '║');
  console.log('╚' + '═'.repeat(70) + '╝');

  cayleyDicksonHierarchy();
  complexFourierNetwork();
  quaternion3DRotationNetwork();
  octonionContextSensitiveReasoning();
  sedenionOverParameterizedSystem();

  console.log('\n' + '═'.repeat(70));
  console.log('CONCLUSION');
  console.log('═'.repeat(70));
  console.log();
  console.log('The extension of Tensor Logic to hypercomplex number systems reveals:');
  console.log();
  console.log('1. UNIFIED FRAMEWORK: Boolean → Real → Complex → Quaternion → ...');
  console.log('   All under the same mathematical umbrella (Einstein summation)');
  console.log();
  console.log('2. ALGEBRAIC STRUCTURE ↔ REASONING CONSTRAINTS:');
  console.log('   - Lose ordering → Gain phase (quantum)');
  console.log('   - Lose commutativity → Gain rotation (3D geometry)');
  console.log('   - Lose associativity → Gain context-sensitivity (syntax)');
  console.log('   - Lose division → Gain over-parameterization (deep learning)');
  console.log();
  console.log('3. PRACTICAL APPLICATIONS:');
  console.log('   - Complex: Quantum ML, signal processing, holographic memory');
  console.log('   - Quaternion: 3D vision, robotics, molecular modeling');
  console.log('   - Octonion: Compositional semantics, physics-informed nets');
  console.log('   - Sedenion+: Understanding over-parameterization');
  console.log();
  console.log('This is HYPERCOMPLEX TENSOR LOGIC - the complete unification of');
  console.log('symbolic, neural, quantum, geometric, and compositional AI.');
  console.log('═'.repeat(70));
  console.log();
}

// For importing individual examples
export const examples = {
  complexFourierNetwork,
  quaternion3DRotationNetwork,
  octonionContextSensitiveReasoning,
  sedenionOverParameterizedSystem,
  cayleyDicksonHierarchy,
  runAllHypercomplexExamples,
};
