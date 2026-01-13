/**
 * RAPTL - Resource-Aware Probabilistic Tensor Logic
 *
 * Implementation based on Ben Goertzel's "Tensor Logic for Bridging Neural and Symbolic AI"
 * https://bengoertzel.substack.com/p/tensor-logic-for-bridging-neural
 *
 * This module extends Tensor Logic with:
 * 1. Semiring abstractions for flexible algebraic reasoning
 * 2. PLN (Probabilistic Logic Networks) truth values
 * 3. Resource tracking (memory, FLOPs, bandwidth)
 * 4. Linear logic modalities for tensor management
 * 5. RAPTL triple product structure
 */

import {
  Tensor,
  einsum,
  threshold,
  add,
  multiply,
  clone,
} from './core';

// ============================================================================
// SEMIRING ABSTRACTION
// ============================================================================

/**
 * A Semiring defines the algebraic structure for tensor operations.
 * Different semirings enable different reasoning modes:
 * - Boolean: Reachability (does any path exist?)
 * - Counting: Path enumeration
 * - Viterbi: Optimization (highest-score paths)
 * - Probabilistic: Expected values under uncertainty
 */
export interface Semiring<T> {
  /** Name of the semiring */
  name: string;

  /** Additive identity (zero element) */
  zero: T;

  /** Multiplicative identity (one element) */
  one: T;

  /** Addition operation (aggregation) */
  add: (a: T, b: T) => T;

  /** Multiplication operation (combination) */
  mul: (a: T, b: T) => T;

  /** Convert from number */
  fromNumber: (n: number) => T;

  /** Convert to number */
  toNumber: (v: T) => number;
}

/**
 * Boolean Semiring: (OR, AND) for reachability queries
 * "Does any path exist between A and B?"
 */
export const BooleanSemiring: Semiring<boolean> = {
  name: 'Boolean',
  zero: false,
  one: true,
  add: (a, b) => a || b,
  mul: (a, b) => a && b,
  fromNumber: (n) => n > 0,
  toNumber: (v) => v ? 1 : 0,
};

/**
 * Counting Semiring: (+, ×) for path enumeration
 * "How many paths exist between A and B?"
 */
export const CountingSemiring: Semiring<number> = {
  name: 'Counting',
  zero: 0,
  one: 1,
  add: (a, b) => a + b,
  mul: (a, b) => a * b,
  fromNumber: (n) => n,
  toNumber: (v) => v,
};

/**
 * Viterbi Semiring: (max, +) for optimization
 * "What is the highest-score path?"
 */
export const ViterbiSemiring: Semiring<number> = {
  name: 'Viterbi',
  zero: -Infinity,
  one: 0,
  add: (a, b) => Math.max(a, b),
  mul: (a, b) => a + b,
  fromNumber: (n) => n === 0 ? -Infinity : Math.log(n),
  toNumber: (v) => v === -Infinity ? 0 : Math.exp(v),
};

/**
 * Probabilistic Semiring: (+, ×) with normalization
 * For expected value computation under uncertainty
 */
export const ProbabilisticSemiring: Semiring<number> = {
  name: 'Probabilistic',
  zero: 0,
  one: 1,
  add: (a, b) => a + b,
  mul: (a, b) => a * b,
  fromNumber: (n) => Math.max(0, Math.min(1, n)),
  toNumber: (v) => v,
};

/**
 * Min-Plus (Tropical) Semiring: (min, +) for shortest paths
 */
export const MinPlusSemiring: Semiring<number> = {
  name: 'MinPlus',
  zero: Infinity,
  one: 0,
  add: (a, b) => Math.min(a, b),
  mul: (a, b) => a + b,
  fromNumber: (n) => n,
  toNumber: (v) => v,
};

/**
 * Apply a semiring operation to tensors
 */
export function semiringEinsum<T>(
  semiring: Semiring<T>,
  notation: string,
  ...tensors: Tensor[]
): Tensor {
  // Parse notation
  const [inputPart, outputIndices] = notation.split('->');
  const inputIndices = inputPart.split(',');

  // Build index sizes map
  const indexSizes = new Map<string, number>();
  for (let t = 0; t < tensors.length; t++) {
    const indices = inputIndices[t];
    for (let i = 0; i < indices.length; i++) {
      indexSizes.set(indices[i], tensors[t].shape[i]);
    }
  }

  // Determine output shape
  const outputShape = [...outputIndices].map(idx => indexSizes.get(idx)!);
  const outputSize = outputShape.reduce((a, b) => a * b, 1);
  const outputData = new Float64Array(outputSize);

  // Initialize with semiring zero
  for (let i = 0; i < outputSize; i++) {
    outputData[i] = semiring.toNumber(semiring.zero);
  }

  // All indices
  const allIndices = [...new Set([...inputIndices.join('')])];
  const indexRanges = allIndices.map(idx => indexSizes.get(idx)!);

  // Compute strides
  const outputStrides = new Map<string, number>();
  let stride = 1;
  for (let i = outputIndices.length - 1; i >= 0; i--) {
    outputStrides.set(outputIndices[i], stride);
    stride *= outputShape[i];
  }

  const inputStrides: Map<string, number>[] = [];
  for (let t = 0; t < tensors.length; t++) {
    const strides = new Map<string, number>();
    let s = 1;
    for (let i = inputIndices[t].length - 1; i >= 0; i--) {
      strides.set(inputIndices[t][i], s);
      s *= tensors[t].shape[i];
    }
    inputStrides.push(strides);
  }

  // Iterate over all index combinations
  const indexValues = new Array(allIndices.length).fill(0);

  const iterate = (depth: number): void => {
    if (depth === allIndices.length) {
      // Compute product using semiring multiplication
      let product: T = semiring.one;
      for (let t = 0; t < tensors.length; t++) {
        let flatIndex = 0;
        for (let i = 0; i < inputIndices[t].length; i++) {
          const idx = inputIndices[t][i];
          const idxPos = allIndices.indexOf(idx);
          flatIndex += indexValues[idxPos] * (inputStrides[t].get(idx) ?? 0);
        }
        product = semiring.mul(product, semiring.fromNumber(tensors[t].data[flatIndex]));
      }

      // Add to output using semiring addition
      let outputFlatIndex = 0;
      for (let i = 0; i < outputIndices.length; i++) {
        const idx = outputIndices[i];
        const idxPos = allIndices.indexOf(idx);
        outputFlatIndex += indexValues[idxPos] * (outputStrides.get(idx) ?? 0);
      }

      const current = semiring.fromNumber(outputData[outputFlatIndex]);
      outputData[outputFlatIndex] = semiring.toNumber(semiring.add(current, product));
      return;
    }

    for (let v = 0; v < indexRanges[depth]; v++) {
      indexValues[depth] = v;
      iterate(depth + 1);
    }
  };

  iterate(0);

  return {
    name: 'result',
    shape: outputShape,
    indices: [...outputIndices],
    data: outputData,
  };
}

// ============================================================================
// PLN TRUTH VALUES
// ============================================================================

/**
 * PLN Truth Value: Strength-Confidence pair
 * - Strength: How likely something is (0 to 1)
 * - Confidence: How much evidence supports that estimate (0 to 1)
 */
export interface PLNTruthValue {
  strength: number;
  confidence: number;
}

/**
 * Create a PLN truth value
 */
export function createTruthValue(strength: number, confidence: number): PLNTruthValue {
  return {
    strength: Math.max(0, Math.min(1, strength)),
    confidence: Math.max(0, Math.min(1, confidence)),
  };
}

/**
 * PLN conjunction (AND): Combines two truth values
 * Uses the independence-based formula from OpenCog's PLN
 */
export function plnConjunction(a: PLNTruthValue, b: PLNTruthValue): PLNTruthValue {
  const strength = a.strength * b.strength;
  // Confidence decreases with independence assumption
  const confidence = a.confidence * b.confidence;
  return createTruthValue(strength, confidence);
}

/**
 * PLN disjunction (OR): Combines two truth values
 */
export function plnDisjunction(a: PLNTruthValue, b: PLNTruthValue): PLNTruthValue {
  const strength = a.strength + b.strength - a.strength * b.strength;
  const confidence = Math.min(a.confidence, b.confidence);
  return createTruthValue(strength, confidence);
}

/**
 * PLN negation (NOT)
 */
export function plnNegation(a: PLNTruthValue): PLNTruthValue {
  return createTruthValue(1 - a.strength, a.confidence);
}

/**
 * PLN deduction: A->B, B->C => A->C
 */
export function plnDeduction(
  ab: PLNTruthValue,
  bc: PLNTruthValue,
  a: PLNTruthValue,
  b: PLNTruthValue,
  c: PLNTruthValue
): PLNTruthValue {
  // Simplified deduction formula
  const strength = ab.strength * bc.strength +
    (1 - ab.strength) * (c.strength - b.strength * bc.strength) /
    Math.max(0.001, 1 - b.strength);

  // Confidence based on evidence combination
  const confidence = ab.confidence * bc.confidence *
    a.confidence * b.confidence * c.confidence;

  return createTruthValue(
    Math.max(0, Math.min(1, strength)),
    Math.pow(confidence, 0.2) // Fifth root for reasonable scaling
  );
}

/**
 * PLN revision: Combine multiple estimates of the same fact
 */
export function plnRevision(a: PLNTruthValue, b: PLNTruthValue): PLNTruthValue {
  // Weight by confidence
  const w1 = a.confidence;
  const w2 = b.confidence;
  const totalW = w1 + w2;

  if (totalW === 0) {
    return createTruthValue(0.5, 0);
  }

  const strength = (a.strength * w1 + b.strength * w2) / totalW;
  // Confidence increases with more evidence
  const confidence = Math.min(0.99, (w1 + w2) / (w1 + w2 + 1));

  return createTruthValue(strength, confidence);
}

/**
 * A tensor with PLN truth values attached to each element
 */
export interface PLNTensor {
  tensor: Tensor;
  truthValues: PLNTruthValue[];
}

/**
 * Create a PLN tensor with uniform confidence
 */
export function createPLNTensor(
  tensor: Tensor,
  confidence: number = 0.9
): PLNTensor {
  const truthValues = Array.from(tensor.data).map(v =>
    createTruthValue(v, confidence)
  );
  return { tensor, truthValues };
}

/**
 * PLN tensor conjunction (element-wise)
 */
export function plnTensorConjunction(a: PLNTensor, b: PLNTensor): PLNTensor {
  const resultTensor = multiply(a.tensor, b.tensor);
  const truthValues = a.truthValues.map((tv, i) =>
    plnConjunction(tv, b.truthValues[i])
  );
  return { tensor: resultTensor, truthValues };
}

// ============================================================================
// RESOURCE TRACKING
// ============================================================================

/**
 * Resource profile for tracking computational requirements
 * Based on RAPTL's resource vector
 */
export interface ResourceProfile {
  /** High Bandwidth Memory bytes */
  hbmBytes: number;
  /** L2 cache bytes */
  l2Bytes: number;
  /** Shared memory bytes */
  sharedMemBytes: number;
  /** Register count */
  registers: number;
  /** Floating point operations */
  flops: number;
  /** Memory bandwidth (bytes/sec) */
  bandwidth: number;
  /** Non-zero elements (for sparse tensors) */
  nnz: number;
  /** Density (nnz / total elements) */
  density: number;
  /** Tensor rank */
  rank: number;
}

/**
 * Create an empty resource profile
 */
export function createResourceProfile(): ResourceProfile {
  return {
    hbmBytes: 0,
    l2Bytes: 0,
    sharedMemBytes: 0,
    registers: 0,
    flops: 0,
    bandwidth: 0,
    nnz: 0,
    density: 1.0,
    rank: 0,
  };
}

/**
 * Estimate resource requirements for a tensor
 */
export function estimateTensorResources(tensor: Tensor): ResourceProfile {
  const totalElements = tensor.shape.reduce((a, b) => a * b, 1);
  const bytesPerElement = 8; // Float64
  const nnz = tensor.data.filter(v => v !== 0).length;

  return {
    hbmBytes: totalElements * bytesPerElement,
    l2Bytes: Math.min(totalElements * bytesPerElement, 6 * 1024 * 1024), // Typical L2 size
    sharedMemBytes: Math.min(totalElements * bytesPerElement, 48 * 1024), // Typical shared mem
    registers: Math.min(tensor.shape.length * 4, 255), // Conservative register estimate
    flops: 0, // No computation for just storing
    bandwidth: totalElements * bytesPerElement, // Memory footprint
    nnz: nnz,
    density: nnz / Math.max(1, totalElements),
    rank: tensor.shape.length,
  };
}

/**
 * Estimate resources for einsum operation
 */
export function estimateEinsumResources(
  notation: string,
  ...tensors: Tensor[]
): ResourceProfile {
  const [inputPart, outputIndices] = notation.split('->');
  const inputIndices = inputPart.split(',');

  // Build index sizes
  const indexSizes = new Map<string, number>();
  for (let t = 0; t < tensors.length; t++) {
    const indices = inputIndices[t];
    for (let i = 0; i < indices.length; i++) {
      indexSizes.set(indices[i], tensors[t].shape[i]);
    }
  }

  // Count total iterations
  const allIndices = [...new Set([...inputIndices.join('')])];
  let totalIterations = 1;
  for (const idx of allIndices) {
    totalIterations *= indexSizes.get(idx) || 1;
  }

  // FLOPs: multiply-add per iteration
  const flops = totalIterations * tensors.length * 2;

  // Memory: sum of all tensor sizes
  const inputBytes = tensors.reduce((sum, t) =>
    sum + t.data.length * 8, 0
  );

  // Output size
  const outputShape = [...outputIndices].map(idx => indexSizes.get(idx)!);
  const outputSize = outputShape.reduce((a, b) => a * b, 1);
  const outputBytes = outputSize * 8;

  return {
    hbmBytes: inputBytes + outputBytes,
    l2Bytes: Math.min(inputBytes + outputBytes, 6 * 1024 * 1024),
    sharedMemBytes: Math.min(inputBytes, 48 * 1024),
    registers: allIndices.length * 4 + 16,
    flops: flops,
    bandwidth: inputBytes + outputBytes,
    nnz: outputSize,
    density: 1.0,
    rank: outputShape.length,
  };
}

/**
 * Combine resources for sequential operations (sum)
 */
export function combineResourcesSequential(...resources: ResourceProfile[]): ResourceProfile {
  return resources.reduce((acc, r) => ({
    hbmBytes: Math.max(acc.hbmBytes, r.hbmBytes),
    l2Bytes: Math.max(acc.l2Bytes, r.l2Bytes),
    sharedMemBytes: Math.max(acc.sharedMemBytes, r.sharedMemBytes),
    registers: Math.max(acc.registers, r.registers),
    flops: acc.flops + r.flops,
    bandwidth: acc.bandwidth + r.bandwidth,
    nnz: acc.nnz + r.nnz,
    density: (acc.density + r.density) / 2,
    rank: Math.max(acc.rank, r.rank),
  }), createResourceProfile());
}

/**
 * Combine resources for parallel operations (max)
 */
export function combineResourcesParallel(...resources: ResourceProfile[]): ResourceProfile {
  return resources.reduce((acc, r) => ({
    hbmBytes: acc.hbmBytes + r.hbmBytes,
    l2Bytes: acc.l2Bytes + r.l2Bytes,
    sharedMemBytes: acc.sharedMemBytes + r.sharedMemBytes,
    registers: Math.max(acc.registers, r.registers),
    flops: Math.max(acc.flops, r.flops),
    bandwidth: Math.max(acc.bandwidth, r.bandwidth),
    nnz: acc.nnz + r.nnz,
    density: (acc.density + r.density) / 2,
    rank: Math.max(acc.rank, r.rank),
  }), createResourceProfile());
}

// ============================================================================
// LINEAR LOGIC MODALITIES
// ============================================================================

/**
 * Linear logic modality types
 * - Linear: Single-use (concert ticket - must be used exactly once)
 * - Affine: At-most-once (coupon - can discard)
 * - Bang: Read-only sharing (library book - many readers)
 * - With: Conditional branching (fork - choose one path)
 */
export type Modality = 'linear' | 'affine' | 'bang' | 'with';

/**
 * A tensor with linear logic modality tracking
 */
export interface ModalTensor {
  tensor: Tensor;
  modality: Modality;
  useCount: number;
  maxUses: number;
  isConsumed: boolean;
}

/**
 * Create a linear tensor (must be used exactly once)
 */
export function createLinearTensor(tensor: Tensor): ModalTensor {
  return {
    tensor: clone(tensor),
    modality: 'linear',
    useCount: 0,
    maxUses: 1,
    isConsumed: false,
  };
}

/**
 * Create an affine tensor (can be used at most once)
 */
export function createAffineTensor(tensor: Tensor): ModalTensor {
  return {
    tensor: clone(tensor),
    modality: 'affine',
    useCount: 0,
    maxUses: 1,
    isConsumed: false,
  };
}

/**
 * Create a bang tensor (can be read many times)
 */
export function createBangTensor(tensor: Tensor): ModalTensor {
  return {
    tensor: clone(tensor),
    modality: 'bang',
    useCount: 0,
    maxUses: Infinity,
    isConsumed: false,
  };
}

/**
 * Create a with tensor (conditional - one of multiple choices)
 */
export function createWithTensor(tensor: Tensor): ModalTensor {
  return {
    tensor: clone(tensor),
    modality: 'with',
    useCount: 0,
    maxUses: 1,
    isConsumed: false,
  };
}

/**
 * Use a modal tensor, respecting linearity constraints
 */
export function useModalTensor(modal: ModalTensor): Tensor {
  if (modal.isConsumed && modal.modality !== 'bang') {
    throw new Error(`Linear logic violation: ${modal.modality} tensor already consumed`);
  }

  if (modal.useCount >= modal.maxUses && modal.modality !== 'bang') {
    throw new Error(`Linear logic violation: ${modal.modality} tensor exceeded max uses`);
  }

  modal.useCount++;

  if (modal.modality === 'linear' || modal.modality === 'affine') {
    modal.isConsumed = true;
    return modal.tensor; // Transfer ownership
  }

  // For bang tensors, return a clone (read-only sharing)
  return clone(modal.tensor);
}

/**
 * Discard an affine tensor (valid for affine, error for linear)
 */
export function discardModalTensor(modal: ModalTensor): void {
  if (modal.modality === 'linear' && !modal.isConsumed) {
    throw new Error('Linear logic violation: linear tensor must be used, cannot be discarded');
  }
  modal.isConsumed = true;
}

/**
 * Check if a modal tensor can still be used
 */
export function canUseModalTensor(modal: ModalTensor): boolean {
  if (modal.modality === 'bang') return true;
  return !modal.isConsumed && modal.useCount < modal.maxUses;
}

// ============================================================================
// RAPTL TRIPLE PRODUCT
// ============================================================================

/**
 * RAPTL Fact: Triple product of logic, uncertainty, and resources
 * Q = Q-logic × Q-uncertainty × Q-resource
 */
export interface RAPTLFact {
  /** Logical content (tensor) */
  logic: Tensor;

  /** Uncertainty (PLN truth values) */
  uncertainty: PLNTruthValue;

  /** Resource requirements */
  resources: ResourceProfile;

  /** Linear logic modality */
  modality: Modality;

  /** Unique identifier */
  id: string;
}

/**
 * Create a RAPTL fact
 */
export function createRAPTLFact(
  id: string,
  tensor: Tensor,
  strength: number = 1.0,
  confidence: number = 0.9,
  modality: Modality = 'bang'
): RAPTLFact {
  return {
    id,
    logic: tensor,
    uncertainty: createTruthValue(strength, confidence),
    resources: estimateTensorResources(tensor),
    modality,
  };
}

/**
 * RAPTL conjunction: Combine two facts
 * - Logic: tensor multiplication/conjunction
 * - Uncertainty: PLN conjunction
 * - Resources: sequential combination
 */
export function raptlConjunction(a: RAPTLFact, b: RAPTLFact): RAPTLFact {
  const logic = multiply(a.logic, b.logic);
  const uncertainty = plnConjunction(a.uncertainty, b.uncertainty);
  const resources = combineResourcesSequential(a.resources, b.resources);

  return {
    id: `(${a.id} ∧ ${b.id})`,
    logic,
    uncertainty,
    resources,
    modality: a.modality === 'linear' || b.modality === 'linear' ? 'linear' : 'affine',
  };
}

/**
 * RAPTL disjunction: Alternative facts
 * - Logic: tensor addition/disjunction
 * - Uncertainty: PLN disjunction
 * - Resources: parallel combination (max)
 */
export function raptlDisjunction(a: RAPTLFact, b: RAPTLFact): RAPTLFact {
  const logic = add(a.logic, b.logic);
  const uncertainty = plnDisjunction(a.uncertainty, b.uncertainty);
  const resources = combineResourcesParallel(a.resources, b.resources);

  return {
    id: `(${a.id} ∨ ${b.id})`,
    logic,
    uncertainty,
    resources,
    modality: 'with', // Choice between alternatives
  };
}

/**
 * RAPTL implication: A -> B as einsum with resource tracking
 */
export function raptlImplication(
  rule: RAPTLFact,
  antecedent: RAPTLFact,
  notation: string
): RAPTLFact {
  const logic = einsum(notation, rule.logic, antecedent.logic);
  const uncertainty = plnConjunction(rule.uncertainty, antecedent.uncertainty);
  const einsumResources = estimateEinsumResources(notation, rule.logic, antecedent.logic);
  const resources = combineResourcesSequential(
    rule.resources,
    antecedent.resources,
    einsumResources
  );

  return {
    id: `(${rule.id} → ${antecedent.id})`,
    logic,
    uncertainty,
    resources,
    modality: rule.modality,
  };
}

/**
 * RAPTL threshold: Apply threshold with uncertainty propagation
 */
export function raptlThreshold(fact: RAPTLFact, t: number = 0): RAPTLFact {
  const logic = threshold(fact.logic, t);

  // Threshold reduces confidence slightly
  const uncertainty = createTruthValue(
    fact.uncertainty.strength,
    fact.uncertainty.confidence * 0.95
  );

  return {
    id: `H(${fact.id})`,
    logic,
    uncertainty,
    resources: fact.resources,
    modality: fact.modality,
  };
}

/**
 * RAPTL grandparent rule example
 * G[x, z] = H(sum over y of: P[x, y] * P[y, z])
 */
export function raptlGrandparent(parent: RAPTLFact): RAPTLFact {
  // Matrix multiplication: Parent @ Parent
  const logic = einsum('xy,yz->xz', parent.logic, parent.logic);

  // Apply threshold
  const thresholdedLogic = threshold(logic, 0);

  // Uncertainty: confidence decreases through inference chain
  const uncertainty = createTruthValue(
    parent.uncertainty.strength * parent.uncertainty.strength,
    parent.uncertainty.confidence * parent.uncertainty.confidence * 0.9
  );

  // Resources: matmul is the main cost
  const matmulResources = estimateEinsumResources('xy,yz->xz', parent.logic, parent.logic);
  const resources = combineResourcesSequential(parent.resources, matmulResources);

  return {
    id: `Grandparent(${parent.id})`,
    logic: thresholdedLogic,
    uncertainty,
    resources,
    modality: parent.modality,
  };
}

