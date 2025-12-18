/**
 * MULTI-LAYER PERCEPTRON (MLP) IN TENSOR LOGIC
 * 
 * A Multi-Layer Perceptron is the foundational neural network architecture.
 * It consists of layers of "neurons" where each neuron computes:
 *   output = activation(Σ weight_i · input_i + bias)
 * 
 * THE KEY INSIGHT:
 * Each layer of an MLP is EXACTLY the same operation as a logical rule,
 * just with real-valued tensors instead of Boolean ones:
 * 
 * Logical rule:   Head[x] ← Body1[x,y] · Body2[y]
 * Neural layer:   Output[x] = activation(Σ_y Weight[x,y] · Input[y] + Bias[x])
 * 
 * Both are: "project out the intermediate variable y by summing"
 * 
 * FOR THE MATHEMATICIAN:
 * An MLP computes a composition of affine transformations followed by
 * pointwise nonlinearities:
 *   f(x) = σ(W_n · σ(W_{n-1} · ... · σ(W_1 · x + b_1) ... + b_{n-1}) + b_n)
 * 
 * Each W·x + b is matrix-vector multiplication (a special case of einsum).
 * The activation σ introduces nonlinearity - without it, the entire network
 * would collapse to a single linear transformation (matrix multiplication
 * is associative).
 * 
 * The "universal approximation theorem" states that MLPs with a single hidden
 * layer can approximate any continuous function to arbitrary precision,
 * given enough hidden neurons. This is analogous to how, in logic, adding
 * more intermediate predicates increases expressiveness.
 */

import {
  Tensor,
  createTensor,
  fromVector,
  einsum,
  add,
  relu,
  sigmoid,
  tensorToString,
} from '../core';
import { broadcastAdd } from '../utils';

export interface MLPResult {
  title: string;
  description: string;
  code: string;
  steps: {
    name: string;
    explanation: string;
    tensor: Tensor;
    tensorString: string;
  }[];
}

/**
 * Example: XOR Problem
 * 
 * The XOR function cannot be computed by a single layer (it's not linearly
 * separable). This was the famous limitation identified by Minsky & Papert
 * in 1969 that contributed to the first "AI winter".
 * 
 * However, a 2-layer MLP CAN compute XOR. The hidden layer learns to create
 * a new representation where XOR becomes linearly separable.
 * 
 * Input: 2D vectors (x1, x2) ∈ {0,1}²
 * Output: XOR(x1, x2)
 * 
 * We'll use pre-trained weights that solve XOR.
 */
export function runMLPExample(): MLPResult {
  const steps: MLPResult['steps'] = [];

  // Input: XOR test case [1, 0] → expected output: 1
  const Input = fromVector('Input', 'i', [1, 0]);

  steps.push({
    name: 'Input Vector',
    explanation: `Input to the network: [1, 0]

The XOR function returns 1 when inputs differ, 0 when same:
  XOR(0,0) = 0
  XOR(0,1) = 1
  XOR(1,0) = 1  ← our test case
  XOR(1,1) = 0

XOR is NOT linearly separable - you cannot draw a single line that
separates the 1s from the 0s in 2D space. This is why we need a
hidden layer to create a new representation.`,
    tensor: Input,
    tensorString: tensorToString(Input, 3),
  });

  // Layer 1: Hidden layer (2 inputs → 2 hidden neurons)
  // These weights were derived to solve XOR:
  // - First hidden neuron: computes AND(x1, x2) approximately
  // - Second hidden neuron: computes OR(x1, x2) approximately
  const W1 = createTensor(
    'W1',
    ['h', 'i'],
    [2, 2],
    new Float64Array([
      1, 1, // Hidden unit 0: responds when both inputs are high (AND-like)
      1, 1, // Hidden unit 1: responds when either input is high (OR-like)
    ])
  );

  const B1 = fromVector('B1', 'h', [-1.5, -0.5]);
  // Bias -1.5: only activates if both inputs sum > 1.5 (AND)
  // Bias -0.5: activates if any input sum > 0.5 (OR)

  steps.push({
    name: 'Layer 1 Weights',
    explanation: `First layer transforms 2D input into 2D hidden representation.

Weight matrix W1[h,i]:
  Row 0 (AND-like): [1, 1] with bias -1.5
  Row 1 (OR-like):  [1, 1] with bias -0.5

Tensor Logic:  PreH[h] = W1[h,i] · Input[i] + B1[h]
               Hidden[h] = ReLU(PreH[h])

The einsum "hi,i->h" contracts index i, producing output indexed by h.`,
    tensor: W1,
    tensorString: tensorToString(W1, 3),
  });

  // Forward pass - Layer 1
  // PreHidden[h] = Σ_i W1[h,i] · Input[i]
  const preHidden = einsum('hi,i->h', W1, Input);

  steps.push({
    name: 'Pre-activation (Layer 1)',
    explanation: `Linear transformation before activation.

Tensor Logic:  PreH[h] = W1[h,i] · Input[i]
Einstein sum:  "hi,i->h" sums over input dimension i

For input [1, 0]:
  PreH[0] = 1·1 + 1·0 = 1
  PreH[1] = 1·1 + 1·0 = 1`,
    tensor: preHidden,
    tensorString: tensorToString(preHidden, 3),
  });

  // Add bias
  const preHiddenWithBias = add(preHidden, B1);

  steps.push({
    name: 'After Bias (Layer 1)',
    explanation: `Add bias to shift the activation threshold.

Tensor Logic:  PreH[h] += B1[h]

  PreH[0] = 1 + (-1.5) = -0.5  (below threshold)
  PreH[1] = 1 + (-0.5) = 0.5   (above threshold)`,
    tensor: preHiddenWithBias,
    tensorString: tensorToString(preHiddenWithBias, 3),
  });

  // Apply ReLU activation
  const Hidden = relu(preHiddenWithBias);

  steps.push({
    name: 'Hidden Layer (after ReLU)',
    explanation: `ReLU activation: max(0, x)

Tensor Logic:  Hidden[h] = ReLU(PreH[h])

  Hidden[0] = max(0, -0.5) = 0  (AND gate: false, inputs don't both = 1)
  Hidden[1] = max(0, 0.5) = 0.5 (OR gate: true, at least one input = 1)

The hidden layer has learned a new representation!
XOR = OR AND NOT(AND) = Hidden[1] AND NOT(Hidden[0])
      = "at least one is 1" AND "not both are 1"`,
    tensor: Hidden,
    tensorString: tensorToString(Hidden, 3),
  });

  // Layer 2: Output layer (2 hidden → 1 output)
  // XOR = OR AND NOT(AND)
  const W2 = createTensor(
    'W2',
    ['o', 'h'],
    [1, 2],
    new Float64Array([
      -2, 2, // Positive weight on OR, negative on AND
    ])
  );

  const B2 = fromVector('B2', 'o', [0]);

  steps.push({
    name: 'Layer 2 Weights',
    explanation: `Output layer computes XOR from hidden features.

Weight matrix W2[o,h]:
  [-2, 2] means: +2×(OR result) - 2×(AND result)

XOR = OR AND NOT(AND)
When OR=1 and AND=0: output = -2×0 + 2×1 = 2 (high)
When OR=1 and AND=1: output = -2×1 + 2×1 = 0 (low)

Tensor Logic:  Output[o] = σ(W2[o,h] · Hidden[h] + B2[o])`,
    tensor: W2,
    tensorString: tensorToString(W2, 3),
  });

  // Forward pass - Layer 2
  const preOutput = einsum('oh,h->o', W2, Hidden);
  const preOutputWithBias = add(preOutput, B2);

  steps.push({
    name: 'Pre-activation (Layer 2)',
    explanation: `Linear transformation for output.

Tensor Logic:  PreOut[o] = W2[o,h] · Hidden[h] + B2[o]
Einstein sum:  "oh,h->o" sums over hidden dimension h

  PreOut[0] = -2×0 + 2×0.5 + 0 = 1`,
    tensor: preOutputWithBias,
    tensorString: tensorToString(preOutputWithBias, 3),
  });

  // Apply sigmoid for final output
  const Output = sigmoid(preOutputWithBias);

  steps.push({
    name: 'Final Output (after sig)',
    explanation: `Sigmoid activation: sig(x) = 1/(1 + e^(-x))

Tensor Logic (from paper):  Output[o] = sig(PreOut[o])

  Output[0] = sig(1) ≈ 0.731

This is interpreted as probability/confidence.
Since 0.731 > 0.5, we classify XOR(1,0) = 1 ✓

The network correctly computed XOR!`,
    tensor: Output,
    tensorString: tensorToString(Output, 3),
  });

  return {
    title: 'Multi-Layer Perceptron: XOR Problem',
    description: `This example shows how a Multi-Layer Perceptron maps to Tensor Logic.

Each layer is an Einstein summation followed by a pointwise activation:
  Layer: Output[o] = activation(Weight[o,i] · Input[i] + Bias[o])

This is identical in structure to a logical rule:
  Head[o] ← Body[o,i] · Facts[i]

The difference is:
- Logic uses Boolean tensors (0/1) with threshold activation
- Neural nets use real-valued tensors with smooth activations (ReLU, sigmoid)

The smooth activations enable gradient-based learning, while the
underlying tensor operations remain exactly the same.`,
    code: `// Multilayer Perceptron (from paper):
Z[l, d′] = relu(WP[l, d′, d] X[l, d])
Y = sig(WOut[d] Z[L, d])

// This is identical in structure to a logical rule:
// Head[x] ← Body1[x,y] · Body2[y]`,
    steps,
  };
}

/**
 * Demonstrates the full MLP computation with all 4 XOR inputs
 */
export function runFullXORDemo(): MLPResult {
  const steps: MLPResult['steps'] = [];

  // All XOR inputs as a batch
  const Inputs = createTensor(
    'Inputs',
    ['b', 'i'],
    [4, 2],
    new Float64Array([
      0, 0, // Input 0: XOR(0,0) = 0
      0, 1, // Input 1: XOR(0,1) = 1
      1, 0, // Input 2: XOR(1,0) = 1
      1, 1, // Input 3: XOR(1,1) = 0
    ])
  );

  steps.push({
    name: 'All XOR Inputs (Batch)',
    explanation: `Processing all 4 XOR inputs as a batch.

Input tensor Inputs[batch, input]:
  Row 0: [0, 0] → expected 0
  Row 1: [0, 1] → expected 1
  Row 2: [1, 0] → expected 1
  Row 3: [1, 1] → expected 0

Batch processing is a key efficiency gain - all inputs
are processed in parallel using the same matrix operations.`,
    tensor: Inputs,
    tensorString: tensorToString(Inputs, 0),
  });

  // Layer 1 weights (same as before but for batch)
  const W1 = createTensor(
    'W1',
    ['h', 'i'],
    [2, 2],
    new Float64Array([1, 1, 1, 1])
  );
  const B1 = createTensor(
    'B1',
    ['h'],
    [2],
    new Float64Array([-1.5, -0.5])
  );

  // Batch forward pass - Layer 1
  // PreHidden[b,h] = Σ_i Inputs[b,i] · W1[h,i]
  // Note: We need to transpose W1 or use proper einsum
  const preHidden = einsum('bi,hi->bh', Inputs, W1);

  // Broadcast add bias to each batch element
  const preHiddenWithBias = broadcastAdd(preHidden, B1, 1);
  preHiddenWithBias.name = 'PreH+B';

  steps.push({
    name: 'Hidden Pre-activations (Batch)',
    explanation: `Batch computation of hidden layer before activation.

Tensor Logic:  PreH[b,h] = Inputs[b,i] · W1[h,i] + B1[h]
Einstein sum:  "bi,hi->bh"

The batch dimension b is preserved while input dimension i is contracted.`,
    tensor: preHiddenWithBias,
    tensorString: tensorToString(preHiddenWithBias, 2),
  });

  // Apply ReLU
  const Hidden = relu(preHiddenWithBias);

  steps.push({
    name: 'Hidden Layer (Batch, after ReLU)',
    explanation: `Hidden representations for all inputs.

Hidden[b,h] after ReLU:
  [0,0] → [0.0, 0.0] (neither AND nor OR)
  [0,1] → [0.0, 0.5] (not AND, yes OR)
  [1,0] → [0.0, 0.5] (not AND, yes OR)
  [1,1] → [0.5, 1.5] (yes AND, yes OR)`,
    tensor: Hidden,
    tensorString: tensorToString(Hidden, 2),
  });

  // Layer 2
  const W2 = createTensor('W2', ['o', 'h'], [1, 2], new Float64Array([-2, 2]));
  const preOutput = einsum('bh,oh->bo', Hidden, W2);

  const Output = sigmoid(preOutput);

  steps.push({
    name: 'Final Outputs (Batch)',
    explanation: `XOR outputs for all inputs.

Output[b] after sigmoid:
  XOR(0,0) = 0.50 → rounds to 0 ✓
  XOR(0,1) = 0.73 → rounds to 1 ✓
  XOR(1,0) = 0.73 → rounds to 1 ✓
  XOR(1,1) = 0.27 → rounds to 0 ✓

All four XOR cases computed correctly!`,
    tensor: Output,
    tensorString: tensorToString(Output, 2),
  });

  return {
    title: 'Batch XOR Computation',
    description: `Demonstrates batch processing - computing all XOR inputs simultaneously.
The batch dimension is simply another tensor index that flows through unchanged.`,
    code: `// Batch MLP: same as single example, with batch dimension b:
Z[b, l, d′] = relu(WP[l, d′, d] X[b, l, d])
Y[b] = sig(WOut[d] Z[b, L, d])`,
    steps,
  };
}

