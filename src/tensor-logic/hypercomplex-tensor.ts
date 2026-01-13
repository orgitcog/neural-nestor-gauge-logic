/**
 * HYPERCOMPLEX TENSOR LOGIC
 * 
 * Extends Tensor Logic to support hypercomplex-valued tensors:
 * - Complex tensors: Quantum-inspired neural networks
 * - Quaternion tensors: 3D spatial reasoning
 * - Octonion tensors: Non-associative reasoning
 * - Sedenion tensors: Over-parameterized systems
 * 
 * This unifies Boolean (symbolic), Real (neural), and Hypercomplex (advanced) AI.
 */

import {
  HypercomplexNumber,
  AlgebraType,
  Complex,
  Quaternion,
  Octonion,
  Sedenion,
  CayleyDickson,
  algebraDimension,
} from './hypercomplex';

/**
 * A hypercomplex-valued tensor
 */
export interface HypercomplexTensor {
  name: string;
  shape: number[];
  indices: string[];
  data: HypercomplexNumber[];
  algebraType: AlgebraType;
}

/**
 * Create a hypercomplex tensor
 */
export function createHypercomplexTensor(
  name: string,
  indices: string[],
  shape: number[],
  algebraType: AlgebraType,
  initializer: 'zeros' | 'ones' | 'random' | HypercomplexNumber[] = 'zeros'
): HypercomplexTensor {
  const size = shape.reduce((a, b) => a * b, 1);
  const dim = algebraDimension(algebraType);
  let data: HypercomplexNumber[];

  if (Array.isArray(initializer)) {
    data = initializer;
  } else if (initializer === 'zeros') {
    data = Array.from({ length: size }, () => 
      new CayleyDickson(new Float64Array(dim), algebraType)
    );
  } else if (initializer === 'ones') {
    data = Array.from({ length: size }, () => {
      const components = new Float64Array(dim);
      components[0] = 1;  // Set real part to 1
      return new CayleyDickson(components, algebraType);
    });
  } else {
    // Random initialization
    data = Array.from({ length: size }, () => {
      const components = new Float64Array(dim);
      for (let i = 0; i < dim; i++) {
        components[i] = (Math.random() - 0.5) * 2;
      }
      return new CayleyDickson(components, algebraType);
    });
  }

  return { name, shape, indices, data, algebraType };
}

/**
 * Create a complex tensor
 */
export function createComplexTensor(
  name: string,
  indices: string[],
  shape: number[],
  initializer: 'zeros' | 'ones' | 'random' | Complex[] = 'zeros'
): HypercomplexTensor {
  const size = shape.reduce((a, b) => a * b, 1);
  let data: Complex[];

  if (Array.isArray(initializer)) {
    data = initializer;
  } else if (initializer === 'zeros') {
    data = Array.from({ length: size }, () => new Complex(0, 0));
  } else if (initializer === 'ones') {
    data = Array.from({ length: size }, () => new Complex(1, 0));
  } else {
    data = Array.from({ length: size }, () => 
      new Complex(Math.random() - 0.5, Math.random() - 0.5)
    );
  }

  return { name, shape, indices, data, algebraType: AlgebraType.Complex };
}

/**
 * Create a quaternion tensor
 */
export function createQuaternionTensor(
  name: string,
  indices: string[],
  shape: number[],
  initializer: 'zeros' | 'ones' | 'random' | Quaternion[] = 'zeros'
): HypercomplexTensor {
  const size = shape.reduce((a, b) => a * b, 1);
  let data: Quaternion[];

  if (Array.isArray(initializer)) {
    data = initializer;
  } else if (initializer === 'zeros') {
    data = Array.from({ length: size }, () => new Quaternion(0, 0, 0, 0));
  } else if (initializer === 'ones') {
    data = Array.from({ length: size }, () => new Quaternion(1, 0, 0, 0));
  } else {
    data = Array.from({ length: size }, () => 
      new Quaternion(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      )
    );
  }

  return { name, shape, indices, data, algebraType: AlgebraType.Quaternion };
}

/**
 * Get element at given indices from hypercomplex tensor
 */
export function getHypercomplexElement(
  tensor: HypercomplexTensor,
  ...indices: number[]
): HypercomplexNumber {
  let flatIndex = 0;
  let stride = 1;
  for (let i = tensor.shape.length - 1; i >= 0; i--) {
    flatIndex += indices[i] * stride;
    stride *= tensor.shape[i];
  }
  return tensor.data[flatIndex];
}

/**
 * Set element at given indices in hypercomplex tensor
 */
export function setHypercomplexElement(
  tensor: HypercomplexTensor,
  value: HypercomplexNumber,
  ...indices: number[]
): void {
  let flatIndex = 0;
  let stride = 1;
  for (let i = tensor.shape.length - 1; i >= 0; i--) {
    flatIndex += indices[i] * stride;
    stride *= tensor.shape[i];
  }
  tensor.data[flatIndex] = value;
}

/**
 * HYPERCOMPLEX EINSTEIN SUMMATION
 * 
 * Generalizes einsum to hypercomplex algebras.
 * 
 * Key difference: Multiplication is now hypercomplex multiplication,
 * which may be:
 * - Non-commutative (quaternions, octonions, ...)
 * - Non-associative (octonions, sedenions, ...)
 * 
 * This affects how we interpret tensor contractions!
 */
export function hypercomplexEinsum(
  notation: string,
  ...tensors: HypercomplexTensor[]
): HypercomplexTensor {
  // Parse the einsum notation
  const [inputPart, outputIndices] = notation.split('->');
  const inputIndices = inputPart.split(',');

  // Verify all tensors have the same algebra type
  const algebraType = tensors[0].algebraType;
  for (const t of tensors) {
    if (t.algebraType !== algebraType) {
      throw new Error('All tensors must have the same algebra type');
    }
  }

  // Build index size map
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

  // Initialize output with zeros
  const dim = algebraDimension(algebraType);
  const outputData: HypercomplexNumber[] = Array.from({ length: outputSize }, () => {
    const components = new Float64Array(dim);
    return new CayleyDickson(components, algebraType);
  });

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
      let product: HypercomplexNumber = tensors[0].data[0];
      
      for (let t = 0; t < tensors.length; t++) {
        let flatIndex = 0;
        for (let i = 0; i < inputIndices[t].length; i++) {
          const idx = inputIndices[t][i];
          const idxPos = allIndices.indexOf(idx);
          flatIndex += indexValues[idxPos] * (inputStrides[t].get(idx) ?? 0);
        }
        
        const element = tensors[t].data[flatIndex];
        if (t === 0) {
          product = element;
        } else {
          // Use appropriate multiplication based on type
          if (element instanceof Complex && product instanceof Complex) {
            product = product.multiply(element);
          } else if (element instanceof Quaternion && product instanceof Quaternion) {
            product = product.multiply(element);
          } else if (element instanceof Octonion && product instanceof Octonion) {
            product = product.multiply(element);
          } else if (element instanceof Sedenion && product instanceof Sedenion) {
            product = product.multiply(element);
          } else if (element instanceof CayleyDickson && product instanceof CayleyDickson) {
            product = product.multiply(element);
          }
        }
      }

      // Add to output at appropriate position
      let outputFlatIndex = 0;
      for (let i = 0; i < outputIndices.length; i++) {
        const idx = outputIndices[i];
        const idxPos = allIndices.indexOf(idx);
        outputFlatIndex += indexValues[idxPos] * (outputStrides.get(idx) ?? 0);
      }
      
      // Accumulate result
      const current = outputData[outputFlatIndex];
      if (current instanceof Complex && product instanceof Complex) {
        outputData[outputFlatIndex] = current.add(product);
      } else if (current instanceof Quaternion && product instanceof Quaternion) {
        outputData[outputFlatIndex] = current.add(product);
      } else if (current instanceof Octonion && product instanceof Octonion) {
        outputData[outputFlatIndex] = current.add(product);
      } else if (current instanceof Sedenion && product instanceof Sedenion) {
        outputData[outputFlatIndex] = current.add(product);
      } else if (current instanceof CayleyDickson && product instanceof CayleyDickson) {
        outputData[outputFlatIndex] = current.add(product);
      }
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
    algebraType,
  };
}

/**
 * Apply element-wise function to hypercomplex tensor
 */
export function mapHypercomplexTensor(
  tensor: HypercomplexTensor,
  fn: (value: HypercomplexNumber) => HypercomplexNumber
): HypercomplexTensor {
  return {
    ...tensor,
    data: tensor.data.map(fn),
  };
}

/**
 * Hypercomplex activation functions
 */

/**
 * Split activation: Apply real-valued function to each component independently
 * This is common in complex-valued neural networks
 */
export function splitActivation(
  tensor: HypercomplexTensor,
  fn: (x: number) => number
): HypercomplexTensor {
  return mapHypercomplexTensor(tensor, (value) => {
    const components = new Float64Array(value.dimension);
    for (let i = 0; i < value.dimension; i++) {
      components[i] = fn(value.components[i]);
    }
    return new CayleyDickson(components, value.algebraType);
  });
}

/**
 * Modulus activation: Uses the norm of the hypercomplex number
 * Output is a real-valued tensor
 */
export function modulusActivation(
  tensor: HypercomplexTensor,
  fn: (norm: number) => number
): HypercomplexTensor {
  return mapHypercomplexTensor(tensor, (value) => {
    const norm = value.norm();
    const activated = fn(norm);
    // Scale the original value by the ratio
    const scale = norm > 0 ? activated / norm : 0;
    return value.scale(scale);
  });
}

/**
 * Complex ReLU (zReLU): ReLU applied to real and imaginary parts
 */
export function complexReLU(tensor: HypercomplexTensor): HypercomplexTensor {
  if (tensor.algebraType !== AlgebraType.Complex) {
    throw new Error('complexReLU only works on complex tensors');
  }
  return splitActivation(tensor, (x) => Math.max(0, x));
}

/**
 * Quaternion ReLU: Apply ReLU to all components
 */
export function quaternionReLU(tensor: HypercomplexTensor): HypercomplexTensor {
  if (tensor.algebraType !== AlgebraType.Quaternion) {
    throw new Error('quaternionReLU only works on quaternion tensors');
  }
  return splitActivation(tensor, (x) => Math.max(0, x));
}

/**
 * Convert hypercomplex tensor to string representation
 */
export function hypercomplexTensorToString(
  tensor: HypercomplexTensor,
  precision = 3
): string {
  if (tensor.shape.length === 1) {
    return `[${tensor.data.map(v => {
      if (v.dimension <= 4) {
        return `(${Array.from(v.components).map(c => c.toFixed(precision)).join(',')})`;
      } else {
        return `(${v.components[0].toFixed(precision)},...)`;
      }
    }).join(', ')}]`;
  }

  if (tensor.shape.length === 2) {
    const [rows, cols] = tensor.shape;
    const lines: string[] = [];
    for (let i = 0; i < rows; i++) {
      const row: string[] = [];
      for (let j = 0; j < cols; j++) {
        const v = tensor.data[i * cols + j];
        if (v.dimension <= 2) {
          row.push(`(${Array.from(v.components).map(c => c.toFixed(precision)).join(',')})`);
        } else {
          row.push(`(${v.components[0].toFixed(precision)},...)`);
        }
      }
      lines.push(`  [${row.join(', ')}]`);
    }
    return `[\n${lines.join(',\n')}\n]`;
  }

  return `HypercomplexTensor(${tensor.algebraType}, shape=[${tensor.shape.join(', ')}])`;
}

/**
 * Extract real parts from hypercomplex tensor
 */
export function extractRealParts(tensor: HypercomplexTensor): Float64Array {
  return new Float64Array(tensor.data.map(v => v.components[0]));
}

/**
 * Extract norms from hypercomplex tensor
 */
export function extractNorms(tensor: HypercomplexTensor): Float64Array {
  return new Float64Array(tensor.data.map(v => v.norm()));
}

/**
 * Convert real tensor to hypercomplex tensor
 */
export function realToHypercomplex(
  realData: Float64Array,
  shape: number[],
  indices: string[],
  algebraType: AlgebraType
): HypercomplexTensor {
  const dim = algebraDimension(algebraType);
  const data: HypercomplexNumber[] = Array.from(realData).map(r => {
    const components = new Float64Array(dim);
    components[0] = r;  // Real part
    return new CayleyDickson(components, algebraType);
  });

  return {
    name: 'converted',
    shape,
    indices,
    data,
    algebraType,
  };
}
