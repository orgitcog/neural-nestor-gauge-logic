/**
 * Tensor Logic Core Engine
 * 
 * Based on Pedro Domingos' paper "Tensor Logic: The Language of AI"
 * 
 * The fundamental insight: logical rules and Einstein summation are the same operation.
 * - In logic: Ancestor(x,z) ← Ancestor(x,y), Parent(y,z) is a JOIN on y then PROJECT to (x,z)
 * - In tensors: C[x,z] = Σ_y A[x,y] · B[y,z] sums over the shared index y
 * 
 * This unification allows us to express both symbolic AI and neural networks
 * in the same language, with the only difference being the atomic data types:
 * - Boolean (0/1) for symbolic logic
 * - Numeric (floats) for neural networks
 */

/**
 * A Tensor is a multi-dimensional array with named indices.
 * The indices are the "arguments" of the relation in logic programming terms.
 */
export interface Tensor {
  name: string;
  shape: number[];
  indices: string[];
  data: Float64Array;
}

/**
 * Create a new tensor with given shape and indices
 */
export function createTensor(
  name: string,
  indices: string[],
  shape: number[],
  initializer: 'zeros' | 'ones' | 'random' | Float64Array = 'zeros'
): Tensor {
  const size = shape.reduce((a, b) => a * b, 1);
  let data: Float64Array;

  if (initializer instanceof Float64Array) {
    data = initializer;
  } else if (initializer === 'zeros') {
    data = new Float64Array(size);
  } else if (initializer === 'ones') {
    data = new Float64Array(size).fill(1);
  } else {
    data = new Float64Array(size).map(() => Math.random() * 2 - 1);
  }

  return { name, shape, indices, data };
}

/**
 * Create a tensor from a 2D array (matrix)
 */
export function fromMatrix(
  name: string,
  indices: [string, string],
  matrix: number[][]
): Tensor {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const data = new Float64Array(rows * cols);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      data[i * cols + j] = matrix[i][j];
    }
  }

  return { name, shape: [rows, cols], indices, data };
}

/**
 * Create a 1D tensor (vector)
 */
export function fromVector(name: string, index: string, values: number[]): Tensor {
  return {
    name,
    shape: [values.length],
    indices: [index],
    data: new Float64Array(values),
  };
}

/**
 * Get element at given indices
 */
export function getElement(tensor: Tensor, ...indices: number[]): number {
  let flatIndex = 0;
  let stride = 1;
  for (let i = tensor.shape.length - 1; i >= 0; i--) {
    flatIndex += indices[i] * stride;
    stride *= tensor.shape[i];
  }
  return tensor.data[flatIndex];
}

/**
 * Set element at given indices
 */
export function setElement(tensor: Tensor, value: number, ...indices: number[]): void {
  let flatIndex = 0;
  let stride = 1;
  for (let i = tensor.shape.length - 1; i >= 0; i--) {
    flatIndex += indices[i] * stride;
    stride *= tensor.shape[i];
  }
  tensor.data[flatIndex] = value;
}

/**
 * EINSTEIN SUMMATION - The Heart of Tensor Logic
 * 
 * Implements the einsum operation which performs:
 * 1. Outer product (Cartesian product) of input tensors
 * 2. Element-wise multiplication
 * 3. Summation over indices not in the output (the "contraction")
 * 
 * This is EXACTLY equivalent to:
 * - JOIN: the outer product aligns matching values
 * - PROJECT: summation removes the contracted indices
 * 
 * Example: einsum("xy,yz->xz", A, B) computes matrix multiplication
 * - x,y from A and y,z from B are joined on y
 * - The result is projected onto x,z by summing over y
 */
export function einsum(notation: string, ...tensors: Tensor[]): Tensor {
  // Parse the einsum notation: "ij,jk->ik"
  const [inputPart, outputIndices] = notation.split('->');
  const inputIndices = inputPart.split(',');

  // Build a map of all unique indices to their dimension sizes
  const indexSizes = new Map<string, number>();
  for (let t = 0; t < tensors.length; t++) {
    const indices = inputIndices[t];
    for (let i = 0; i < indices.length; i++) {
      const idx = indices[i];
      const size = tensors[t].shape[i];
      if (indexSizes.has(idx)) {
        if (indexSizes.get(idx) !== size) {
          throw new Error(`Index ${idx} has inconsistent sizes`);
        }
      } else {
        indexSizes.set(idx, size);
      }
    }
  }

  // Determine output shape
  const outputShape = [...outputIndices].map((idx) => indexSizes.get(idx)!);
  const outputSize = outputShape.reduce((a, b) => a * b, 1);
  const outputData = new Float64Array(outputSize);

  // All indices (including contracted ones)
  const allIndices = [...new Set([...inputIndices.join('')])];

  // Compute strides for output tensor
  const outputStrides = new Map<string, number>();
  let stride = 1;
  for (let i = outputIndices.length - 1; i >= 0; i--) {
    outputStrides.set(outputIndices[i], stride);
    stride *= outputShape[i];
  }

  // Compute strides for input tensors
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

  // Generate all combinations of index values
  const indexRanges = allIndices.map((idx) => indexSizes.get(idx)!);

  // Iterate over all possible index combinations
  const indexValues = new Array(allIndices.length).fill(0);

  const iterate = (depth: number): void => {
    if (depth === allIndices.length) {
      // Compute the product of all tensor elements at current indices
      let product = 1;
      for (let t = 0; t < tensors.length; t++) {
        let flatIndex = 0;
        for (let i = 0; i < inputIndices[t].length; i++) {
          const idx = inputIndices[t][i];
          const idxPos = allIndices.indexOf(idx);
          flatIndex += indexValues[idxPos] * (inputStrides[t].get(idx) ?? 0);
        }
        product *= tensors[t].data[flatIndex];
      }

      // Add to output at appropriate position
      let outputFlatIndex = 0;
      for (let i = 0; i < outputIndices.length; i++) {
        const idx = outputIndices[i];
        const idxPos = allIndices.indexOf(idx);
        outputFlatIndex += indexValues[idxPos] * (outputStrides.get(idx) ?? 0);
      }
      outputData[outputFlatIndex] += product;
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

/**
 * LOGICAL OPERATIONS
 * 
 * In Boolean tensors (0/1 values), einsum becomes logical inference:
 * - Multiplication is AND
 * - Summation followed by threshold (>0) is OR
 * 
 * This is how logical rules translate to tensor operations:
 * Ancestor(x,z) ← Ancestor(x,y), Parent(y,z)
 * becomes:
 * Ancestor[x,z] = threshold(Σ_y Ancestor[x,y] · Parent[y,z])
 */

/**
 * Apply threshold (for Boolean logic) - values > 0 become 1, else 0
 */
export function threshold(tensor: Tensor, t = 0): Tensor {
  const data = new Float64Array(tensor.data.length);
  for (let i = 0; i < tensor.data.length; i++) {
    data[i] = tensor.data[i] > t ? 1 : 0;
  }
  return { ...tensor, data };
}

/**
 * Sigmoid activation function - smooth version of threshold
 * σ(x, T) = 1 / (1 + e^(-x/T))
 * 
 * At temperature T=0, this is a hard threshold (Boolean logic)
 * At higher T, it becomes a soft "probability" (neural network style)
 */
export function sigmoid(tensor: Tensor, temperature = 1): Tensor {
  const data = new Float64Array(tensor.data.length);
  for (let i = 0; i < tensor.data.length; i++) {
    if (temperature === 0) {
      data[i] = tensor.data[i] > 0 ? 1 : 0;
    } else {
      data[i] = 1 / (1 + Math.exp(-tensor.data[i] / temperature));
    }
  }
  return { ...tensor, data };
}

/**
 * ReLU activation: max(0, x)
 * Common in neural networks - passes positive values, zeros out negatives
 */
export function relu(tensor: Tensor): Tensor {
  const data = new Float64Array(tensor.data.length);
  for (let i = 0; i < tensor.data.length; i++) {
    data[i] = Math.max(0, tensor.data[i]);
  }
  return { ...tensor, data };
}

/**
 * Softmax: exp(x_i) / Σ exp(x_j)
 * Converts a vector of real numbers into a probability distribution
 * The "soft" version of argmax
 */
export function softmax(tensor: Tensor, axis = -1): Tensor {
  if (tensor.shape.length !== 1 && tensor.shape.length !== 2) {
    throw new Error('Softmax currently supports 1D and 2D tensors');
  }

  const data = new Float64Array(tensor.data.length);

  if (tensor.shape.length === 1) {
    // 1D tensor
    const max = Math.max(...tensor.data);
    let sum = 0;
    for (let i = 0; i < tensor.data.length; i++) {
      data[i] = Math.exp(tensor.data[i] - max);
      sum += data[i];
    }
    for (let i = 0; i < data.length; i++) {
      data[i] /= sum;
    }
  } else {
    // 2D tensor - apply along axis
    const actualAxis = axis === -1 ? 1 : axis;
    const [rows, cols] = tensor.shape;

    if (actualAxis === 1) {
      // Softmax along columns (each row is independent)
      for (let i = 0; i < rows; i++) {
        const rowStart = i * cols;
        let max = -Infinity;
        for (let j = 0; j < cols; j++) {
          max = Math.max(max, tensor.data[rowStart + j]);
        }
        let sum = 0;
        for (let j = 0; j < cols; j++) {
          data[rowStart + j] = Math.exp(tensor.data[rowStart + j] - max);
          sum += data[rowStart + j];
        }
        for (let j = 0; j < cols; j++) {
          data[rowStart + j] /= sum;
        }
      }
    } else {
      // Softmax along rows (each column is independent)
      for (let j = 0; j < cols; j++) {
        let max = -Infinity;
        for (let i = 0; i < rows; i++) {
          max = Math.max(max, tensor.data[i * cols + j]);
        }
        let sum = 0;
        for (let i = 0; i < rows; i++) {
          data[i * cols + j] = Math.exp(tensor.data[i * cols + j] - max);
          sum += data[i * cols + j];
        }
        for (let i = 0; i < rows; i++) {
          data[i * cols + j] /= sum;
        }
      }
    }
  }

  return { ...tensor, data };
}

/**
 * Element-wise addition of tensors
 */
export function add(...tensors: Tensor[]): Tensor {
  const first = tensors[0];
  const data = new Float64Array(first.data.length);

  for (let i = 0; i < data.length; i++) {
    data[i] = tensors.reduce((sum, t) => sum + t.data[i], 0);
  }

  return { ...first, data };
}

/**
 * Element-wise multiplication (Hadamard product)
 */
export function multiply(...tensors: Tensor[]): Tensor {
  const first = tensors[0];
  const data = new Float64Array(first.data.length);

  for (let i = 0; i < data.length; i++) {
    data[i] = tensors.reduce((prod, t) => prod * t.data[i], 1);
  }

  return { ...first, data };
}

/**
 * Scalar multiplication
 */
export function scale(tensor: Tensor, scalar: number): Tensor {
  const data = new Float64Array(tensor.data.length);
  for (let i = 0; i < data.length; i++) {
    data[i] = tensor.data[i] * scalar;
  }
  return { ...tensor, data };
}

/**
 * Transpose a 2D tensor
 */
export function transpose(tensor: Tensor): Tensor {
  if (tensor.shape.length !== 2) {
    throw new Error('Transpose only works on 2D tensors');
  }

  const [rows, cols] = tensor.shape;
  const data = new Float64Array(tensor.data.length);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      data[j * rows + i] = tensor.data[i * cols + j];
    }
  }

  return {
    name: tensor.name,
    shape: [cols, rows],
    indices: [tensor.indices[1], tensor.indices[0]],
    data,
  };
}

/**
 * Convert tensor to human-readable string
 */
export function tensorToString(tensor: Tensor, precision = 3): string {
  if (tensor.shape.length === 1) {
    return `[${Array.from(tensor.data)
      .map((v) => v.toFixed(precision))
      .join(', ')}]`;
  }

  if (tensor.shape.length === 2) {
    const [rows, cols] = tensor.shape;
    const lines: string[] = [];
    for (let i = 0; i < rows; i++) {
      const row: string[] = [];
      for (let j = 0; j < cols; j++) {
        row.push(tensor.data[i * cols + j].toFixed(precision));
      }
      lines.push(`  [${row.join(', ')}]`);
    }
    return `[\n${lines.join(',\n')}\n]`;
  }

  // Handle 3D tensors: show as slices
  if (tensor.shape.length === 3) {
    const [dim0, dim1, dim2] = tensor.shape;
    const slices: string[] = [];
    for (let i = 0; i < dim0; i++) {
      const slice: string[] = [];
      for (let j = 0; j < dim1; j++) {
        const row: string[] = [];
        for (let k = 0; k < dim2; k++) {
          const idx = i * (dim1 * dim2) + j * dim2 + k;
          row.push(tensor.data[idx].toFixed(precision));
        }
        slice.push(`    [${row.join(', ')}]`);
      }
      slices.push(`  ${tensor.indices[0]}=${i}:\n${slice.join(',\n')}`);
    }
    return `[\n${slices.join('\n\n')}\n]`;
  }

  // For 4D and higher, show a summary with some sample values
  if (tensor.shape.length >= 4) {
    const totalSize = tensor.shape.reduce((a, b) => a * b, 1);
    const sampleSize = Math.min(20, totalSize);
    const sampleValues: string[] = [];
    for (let i = 0; i < sampleSize; i++) {
      sampleValues.push(tensor.data[i].toFixed(precision));
    }
    const remaining = totalSize - sampleSize;
    return `Tensor(shape=[${tensor.shape.join(', ')}], indices=[${tensor.indices.join(', ')}])\n` +
           `First ${sampleSize} values: [${sampleValues.join(', ')}]${remaining > 0 ? ` ... (${remaining} more)` : ''}`;
  }

  // Fallback for any other case
  return `Tensor(shape=[${tensor.shape.join(', ')}], indices=[${tensor.indices.join(', ')}])`;
}

/**
 * Clone a tensor
 */
export function clone(tensor: Tensor): Tensor {
  return {
    name: tensor.name,
    shape: [...tensor.shape],
    indices: [...tensor.indices],
    data: new Float64Array(tensor.data),
  };
}

/**
 * Create an identity matrix
 */
export function identity(name: string, indices: [string, string], size: number): Tensor {
  const data = new Float64Array(size * size);
  for (let i = 0; i < size; i++) {
    data[i * size + i] = 1;
  }
  return { name, shape: [size, size], indices, data };
}

