/**
 * KERNEL MACHINES IN TENSOR LOGIC
 * 
 * Kernel machines (including Support Vector Machines) are a powerful class of
 * ML models based on the "kernel trick" - implicitly mapping data to a
 * high-dimensional feature space where linear methods become powerful.
 * 
 * THE KEY INSIGHT:
 * A kernel function k(x, x') measures similarity between data points.
 * The kernel matrix K[i,j] = k(x_i, x_j) is a tensor, and kernel-based
 * predictions are just Einstein summations over this tensor!
 * 
 * Prediction: f(x) = Σ_i α_i · k(x_i, x)
 *             In tensor logic: Output = Alpha[i] · Kernel[i,j] · Input[j]
 * 
 * FOR THE MATHEMATICIAN:
 * The kernel trick exploits Mercer's theorem: any positive semi-definite
 * kernel k(x,x') can be written as an inner product in some feature space:
 *   k(x, x') = φ(x) · φ(x')
 * 
 * This means we can work with the kernel directly without ever computing
 * the (potentially infinite-dimensional) feature mapping φ.
 * 
 * The connection to logic programming is fascinating: if we use a Boolean
 * kernel (k(x,x') = 1 if x "matches" x', 0 otherwise), kernel predictions
 * become logical inference over a database of known facts!
 * 
 * Common kernels:
 * - Linear: k(x,x') = x·x'
 * - Polynomial: k(x,x') = (x·x' + c)^d
 * - RBF (Gaussian): k(x,x') = exp(-||x-x'||² / 2σ²)
 * - String kernels: count shared substrings
 */

import {
  Tensor,
  createTensor,
  fromVector,
  einsum,
  tensorToString,
} from '../core';

export interface KernelResult {
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
 * Compute linear kernel: K[i,j] = X[i,d] · X[j,d]
 */
function linearKernel(X: Tensor): Tensor {
  return einsum('id,jd->ij', X, X);
}

/**
 * Compute RBF (Gaussian) kernel: K[i,j] = exp(-||x_i - x_j||² / 2σ²)
 */
function rbfKernel(X: Tensor, sigma: number): Tensor {
  const n = X.shape[0];
  const d = X.shape[1];
  const K = createTensor('K', ['i', 'j'], [n, n], 'zeros');

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sqDist = 0;
      for (let k = 0; k < d; k++) {
        const diff = X.data[i * d + k] - X.data[j * d + k];
        sqDist += diff * diff;
      }
      K.data[i * n + j] = Math.exp(-sqDist / (2 * sigma * sigma));
    }
  }

  return K;
}

/**
 * Example: Kernel-based Classification
 * 
 * We'll use a simple kernel SVM-style classifier on 2D data.
 * The data is the XOR problem (not linearly separable), but
 * with an RBF kernel it becomes separable in the feature space.
 */
export function runKernelExample(): KernelResult {
  const steps: KernelResult['steps'] = [];

  // Training data: XOR pattern
  // (0,0) → -1, (0,1) → +1, (1,0) → +1, (1,1) → -1
  const X_train = createTensor(
    'X_train',
    ['sample', 'feature'],
    [4, 2],
    new Float64Array([
      0, 0, // Sample 0
      0, 1, // Sample 1
      1, 0, // Sample 2
      1, 1, // Sample 3
    ])
  );

  steps.push({
    name: 'Training Data',
    explanation: `XOR classification problem - not linearly separable!

X_train[sample, feature]:
  Sample 0: [0, 0] → class -1
  Sample 1: [0, 1] → class +1
  Sample 2: [1, 0] → class +1
  Sample 3: [1, 1] → class -1

No straight line can separate +1 from -1 in this 2D space.
The kernel trick maps to a higher-dimensional space where
a linear separator exists.`,
    tensor: X_train,
    tensorString: tensorToString(X_train, 0),
  });

  // Labels
  const Y_train = fromVector('Y_train', 'sample', [-1, 1, 1, -1]);

  steps.push({
    name: 'Training Labels',
    explanation: `Class labels for XOR:
  Y[0] = -1 (both inputs same: 0,0)
  Y[1] = +1 (inputs differ: 0,1)
  Y[2] = +1 (inputs differ: 1,0)
  Y[3] = -1 (both inputs same: 1,1)`,
    tensor: Y_train,
    tensorString: tensorToString(Y_train, 0),
  });

  // Compute linear kernel first (to show it doesn't work well)
  const K_linear = linearKernel(X_train);
  K_linear.name = 'K_linear';

  steps.push({
    name: 'Linear Kernel Matrix',
    explanation: `Linear kernel: K[i,j] = X[i,d] · X[j,d]

Tensor Logic: K[i,j] = X_train[i,d] · X_train[j,d]
Einstein sum: "id,jd->ij"

The linear kernel measures dot-product similarity.
This preserves the original geometry where XOR is
not linearly separable.`,
    tensor: K_linear,
    tensorString: tensorToString(K_linear, 2),
  });

  // Compute RBF kernel (this WILL work for XOR)
  const sigma = 0.5;
  const K_rbf = rbfKernel(X_train, sigma);
  K_rbf.name = 'K_rbf';

  steps.push({
    name: 'RBF (Gaussian) Kernel Matrix',
    explanation: `RBF kernel: K[i,j] = exp(-||x_i - x_j||² / 2σ²)

With σ = ${sigma}, this measures "Gaussian similarity".
Points close together have K ≈ 1, far apart have K ≈ 0.

The RBF kernel implicitly maps to infinite dimensions!
In this space, XOR becomes linearly separable.

Diagonal entries are always 1 (each point is identical to itself).`,
    tensor: K_rbf,
    tensorString: tensorToString(K_rbf, 3),
  });

  // For a true SVM, we'd solve a quadratic program to find α.
  // For demonstration, we'll use pre-computed α values that work.
  // These are the dual coefficients: α_i · y_i
  const Alpha = fromVector('Alpha', 'i', [1, 1, 1, 1]);

  steps.push({
    name: 'Dual Coefficients (α)',
    explanation: `The α values are learned by solving:
  max Σα_i - ½ΣΣ α_i α_j y_i y_j k(x_i, x_j)
  s.t. α_i ≥ 0, Σα_i y_i = 0

For this simple example, we use uniform weights.
In practice, SVMs find sparse α (support vectors).`,
    tensor: Alpha,
    tensorString: tensorToString(Alpha, 3),
  });

  // Test prediction on training data
  // f(x) = Σ_i α_i · y_i · k(x_i, x)
  // In matrix form: Predictions = K · (α ⊙ y)
  const AlphaY = createTensor(
    'AlphaY',
    ['i'],
    [4],
    new Float64Array([
      Alpha.data[0] * Y_train.data[0],
      Alpha.data[1] * Y_train.data[1],
      Alpha.data[2] * Y_train.data[2],
      Alpha.data[3] * Y_train.data[3],
    ])
  );

  steps.push({
    name: 'α ⊙ y (element-wise)',
    explanation: `Combine coefficients with labels:
  (α ⊙ y)[i] = α[i] · y[i]

  [1·(-1), 1·(+1), 1·(+1), 1·(-1)] = [-1, 1, 1, -1]

This incorporates the class information into the weights.`,
    tensor: AlphaY,
    tensorString: tensorToString(AlphaY, 0),
  });

  // Compute predictions: Pred[j] = Σ_i K[i,j] · AlphaY[i]
  const Predictions = einsum('ij,i->j', K_rbf, AlphaY);
  Predictions.name = 'Predictions';

  steps.push({
    name: 'Raw Predictions',
    explanation: `Kernel prediction: Pred[j] = K[i,j] · (α⊙y)[i]

Tensor Logic: Predictions[j] = K_rbf[i,j] · AlphaY[i]
Einstein sum: "ij,i->j" contracts over training samples i

Each prediction is a weighted sum of kernel similarities
to training points, weighted by their α·y values.

This is exactly like logical inference: we're "looking up"
similar examples and combining their labels.`,
    tensor: Predictions,
    tensorString: tensorToString(Predictions, 3),
  });

  // Apply sign for classification
  const ClassPredictions = createTensor(
    'ClassPredictions',
    ['j'],
    [4],
    new Float64Array(Predictions.data.map((v) => (v >= 0 ? 1 : -1)))
  );

  steps.push({
    name: 'Class Predictions (sign)',
    explanation: `Final predictions: sign(raw predictions)

  Pred[0] = ${Predictions.data[0].toFixed(2)} → ${ClassPredictions.data[0]} (true: -1) ${ClassPredictions.data[0] === Y_train.data[0] ? '✓' : '✗'}
  Pred[1] = ${Predictions.data[1].toFixed(2)} → ${ClassPredictions.data[1]} (true: +1) ${ClassPredictions.data[1] === Y_train.data[1] ? '✓' : '✗'}
  Pred[2] = ${Predictions.data[2].toFixed(2)} → ${ClassPredictions.data[2]} (true: +1) ${ClassPredictions.data[2] === Y_train.data[2] ? '✓' : '✗'}
  Pred[3] = ${Predictions.data[3].toFixed(2)} → ${ClassPredictions.data[3]} (true: -1) ${ClassPredictions.data[3] === Y_train.data[3] ? '✓' : '✗'}

The RBF kernel successfully classifies XOR!`,
    tensor: ClassPredictions,
    tensorString: tensorToString(ClassPredictions, 0),
  });

  return {
    title: 'Kernel Machines in Tensor Logic',
    description: `Kernel methods map data to high-dimensional feature spaces
where linear methods become powerful. The "kernel trick" lets us
work with kernels k(x,x') directly, never computing the mapping.

From the paper, kernel machines compute similarity between inputs:

General form:
  Y = Σ_i α[i] K(X, X_i)

Polynomial kernel:
  K[x, x′] = (Σ_i X[x, i] X[x′, i] + 1)^d

Gaussian kernel (RBF):
  K[x, x′] = exp(-γ Σ_i (X[x, i] - X[x′, i])²)

The connection to Tensor Logic:
  Prediction[j] = Alpha[i] · Y[i] · Kernel[i,j]
  
This is Einstein summation over the kernel matrix!

The connection to logic:
- Boolean kernels (k=1 if match, 0 otherwise) give logical inference
- RBF kernels give "fuzzy" matching based on similarity
- This bridges discrete (logic) and continuous (neural) AI

Kernels can encode rich structure:
- String kernels for text (count shared substrings)
- Graph kernels for molecules (shared subgraphs)
- Custom kernels for domain knowledge`,
    code: `// Kernel Machines (from paper):
Y = Σ_i α[i] K(X, X_i)

// Polynomial kernel:
K[x, x′] = (Σ_i X[x, i] X[x′, i] + 1)^d

// Gaussian kernel (RBF):
K[x, x′] = exp(-γ Σ_i (X[x, i] - X[x′, i])²)`,
    steps,
  };
}

