/**
 * NEURAL NESTOR GAUGE LOGIC
 * 
 * This module extends Tensor Logic with Nestors - nested tensors forming
 * rooted hypertrees with fiber bundle hypernodes.
 * 
 * MATHEMATICAL FRAMEWORK:
 * 
 * 1. NESTORS: Nested tensors with hierarchical structure
 *    - Each Nestor is a tensor that can contain other Nestors
 *    - Forms a rooted hypertree: tree structure where nodes can be hypergraphs
 *    - Enables compositional reasoning across multiple scales
 * 
 * 2. FIBER BUNDLES: Each hypernode has a fiber space
 *    - Base space: The graph/hypertree structure
 *    - Fiber: Vector space attached to each node
 *    - Enables smooth transformations across the structure
 * 
 * 3. GAUGE TRANSFORMATIONS: Smooth differential structure
 *    - Connection: defines parallel transport across edges
 *    - Curvature: measures non-commutativity of transformations
 *    - Gradients flow through the nested structure
 * 
 * 4. CATEGORICAL LOGIC: Composition rules
 *    - Morphisms between Nestors preserve structure
 *    - Functorial: maps between categories preserve composition
 *    - Natural transformations provide higher-level abstractions
 */

import {
  Tensor,
  createTensor,
  einsum,
  clone,
} from './core';

/**
 * A Nestor is a nested tensor structure forming a rooted hypertree.
 * Each node can have child Nestors, creating a hierarchical composition.
 */
export interface Nestor {
  /** Unique identifier for this Nestor */
  id: string;
  
  /** The tensor data at this level */
  tensor: Tensor;
  
  /** Child Nestors forming the hypertree structure */
  children: Nestor[];
  
  /** Fiber bundle: vector space attached to this node */
  fiber?: FiberBundle;
  
  /** Type information for typed hyper-graphs */
  typeInfo: NestorType;
  
  /** Metadata for this Nestor node */
  metadata?: Record<string, unknown>;
}

/**
 * Fiber Bundle: Attaches a vector space to each node in the hypertree.
 * This enables smooth transformations across the structure.
 */
export interface FiberBundle {
  /** Base point in the hypertree */
  baseId: string;
  
  /** Dimension of the fiber space */
  fiberDim: number;
  
  /** Fiber coordinates/vectors */
  fiberData: Tensor;
  
  /** Connection coefficients for parallel transport */
  connection?: Tensor;
}

/**
 * Type information for Nestors, enabling typed hyper-graph neural networks.
 */
export interface NestorType {
  /** Node type (e.g., 'entity', 'relation', 'attribute') */
  nodeType: string;
  
  /** Edge types for connections to children */
  edgeTypes: string[];
  
  /** Signature: input/output tensor shapes and indices */
  signature: {
    inputShape: number[];
    outputShape: number[];
    indices: string[];
  };
}

/**
 * A morphism between Nestors that preserves the nested structure.
 * This is the fundamental arrow in the category of Nestors.
 */
export interface NestorMorphism {
  /** Source Nestor */
  source: Nestor;
  
  /** Target Nestor */
  target: Nestor;
  
  /** Transformation at each level */
  transform: (tensor: Tensor) => Tensor;
  
  /** Preserve fiber bundle structure */
  fiberTransform?: (fiber: FiberBundle) => FiberBundle;
}

/**
 * Gauge connection: defines how to parallel transport tensors across edges.
 */
export interface GaugeConnection {
  /** Connection 1-form: defines parallel transport */
  connectionForm: Tensor;
  
  /** Curvature 2-form: measures non-commutativity */
  curvature?: Tensor;
  
  /** Covariant derivative operator */
  covariantDerivative: (tensor: Tensor, direction: Tensor) => Tensor;
}

/**
 * Create a new Nestor node
 */
export function createNestor(
  id: string,
  tensor: Tensor,
  typeInfo: NestorType,
  children: Nestor[] = []
): Nestor {
  return {
    id,
    tensor,
    children,
    typeInfo,
    metadata: {},
  };
}

/**
 * Create a fiber bundle attached to a Nestor
 */
export function createFiberBundle(
  baseId: string,
  fiberDim: number,
  fiberData?: Tensor
): FiberBundle {
  const fiber = fiberData || createTensor(
    `fiber_${baseId}`,
    ['f'],
    [fiberDim],
    'random'
  );
  
  return {
    baseId,
    fiberDim,
    fiberData: fiber,
  };
}

/**
 * Attach a fiber bundle to a Nestor
 */
export function attachFiberBundle(nestor: Nestor, fiber: FiberBundle): Nestor {
  return {
    ...nestor,
    fiber,
  };
}

/**
 * Compute the depth of a Nestor hypertree
 */
export function nestorDepth(nestor: Nestor): number {
  if (nestor.children.length === 0) {
    return 1;
  }
  return 1 + Math.max(...nestor.children.map(nestorDepth));
}

/**
 * Count total nodes in a Nestor hypertree
 */
export function nestorNodeCount(nestor: Nestor): number {
  return 1 + nestor.children.reduce((sum, child) => sum + nestorNodeCount(child), 0);
}

/**
 * Traverse a Nestor hypertree with a visitor function
 */
export function traverseNestor(
  nestor: Nestor,
  visitor: (n: Nestor, depth: number) => void,
  depth = 0
): void {
  visitor(nestor, depth);
  nestor.children.forEach(child => traverseNestor(child, visitor, depth + 1));
}

/**
 * Map a function over all tensors in a Nestor hypertree
 */
export function mapNestorTensors(
  nestor: Nestor,
  fn: (tensor: Tensor) => Tensor
): Nestor {
  return {
    ...nestor,
    tensor: fn(nestor.tensor),
    children: nestor.children.map(child => mapNestorTensors(child, fn)),
    fiber: nestor.fiber ? {
      ...nestor.fiber,
      fiberData: fn(nestor.fiber.fiberData),
    } : undefined,
  };
}

/**
 * Aggregate tensors from all nodes in a Nestor hypertree.
 * This performs a bottom-up aggregation, combining child results.
 */
export function aggregateNestor(
  nestor: Nestor,
  aggregator: (current: Tensor, children: Tensor[]) => Tensor
): Tensor {
  const childResults = nestor.children.map(child => aggregateNestor(child, aggregator));
  return aggregator(nestor.tensor, childResults);
}

/**
 * Create a gauge connection for parallel transport between Nestors.
 * The connection defines how tensors are transported along edges.
 */
export function createGaugeConnection(
  connectionForm: Tensor,
  computeCurvature = false
): GaugeConnection {
  // Covariant derivative: ∇_X Y = dY(X) + [A, Y]
  // where A is the connection form
  const covariantDerivative = (tensor: Tensor, _direction: Tensor): Tensor => {
    // Simplified covariant derivative: just transport along the connection
    return einsum('ij,j->i', connectionForm, tensor);
  };
  
  return {
    connectionForm,
    curvature: computeCurvature ? computeCurvatureTensor(connectionForm) : undefined,
    covariantDerivative,
  };
}

/**
 * Compute curvature tensor from a gauge connection.
 * F = dA + A ∧ A (field strength tensor)
 */
function computeCurvatureTensor(connectionForm: Tensor): Tensor {
  // For a U(1) gauge theory, F = dA
  // For non-abelian, F = dA + A ∧ A
  // Simplified version: just return the connection form squared
  return einsum('ij,jk->ik', connectionForm, connectionForm);
}

/**
 * Parallel transport a tensor along an edge using the gauge connection.
 */
export function parallelTransport(
  tensor: Tensor,
  connection: GaugeConnection,
  path: Tensor
): Tensor {
  return connection.covariantDerivative(tensor, path);
}

/**
 * Compute smooth differential gradients through a Nestor hypertree.
 * This enables backpropagation through the nested structure.
 */
export function computeNestorGradient(
  nestor: Nestor,
  loss: (t: Tensor) => number,
  epsilon = 1e-5
): Map<string, Tensor> {
  const gradients = new Map<string, Tensor>();
  
  // Compute gradient for this node
  const grad = numericalGradient(nestor.tensor, loss, epsilon);
  gradients.set(nestor.id, grad);
  
  // Recursively compute gradients for children
  nestor.children.forEach(child => {
    const childGrads = computeNestorGradient(child, loss, epsilon);
    childGrads.forEach((g, id) => gradients.set(id, g));
  });
  
  return gradients;
}

/**
 * Compute numerical gradient of a loss function with respect to a tensor.
 */
function numericalGradient(
  tensor: Tensor,
  loss: (t: Tensor) => number,
  epsilon = 1e-5
): Tensor {
  const grad = createTensor(
    `grad_${tensor.name}`,
    tensor.indices,
    tensor.shape,
    'zeros'
  );
  
  const originalLoss = loss(tensor);
  
  for (let i = 0; i < tensor.data.length; i++) {
    const original = tensor.data[i];
    
    // Forward difference
    tensor.data[i] = original + epsilon;
    const lossPlus = loss(tensor);
    
    // Compute gradient
    grad.data[i] = (lossPlus - originalLoss) / epsilon;
    
    // Restore original value
    tensor.data[i] = original;
  }
  
  return grad;
}

/**
 * Apply a gauge transformation to a Nestor.
 * This transforms the fiber bundles while preserving the physical content.
 */
export function gaugeTransform(
  nestor: Nestor,
  gauge: (fiber: FiberBundle) => FiberBundle
): Nestor {
  return {
    ...nestor,
    fiber: nestor.fiber ? gauge(nestor.fiber) : undefined,
    children: nestor.children.map(child => gaugeTransform(child, gauge)),
  };
}

/**
 * Compose two Nestor morphisms.
 * This is the fundamental composition in the category of Nestors.
 */
export function composeMorphisms(
  f: NestorMorphism,
  g: NestorMorphism
): NestorMorphism {
  if (f.target.id !== g.source.id) {
    throw new Error('Cannot compose morphisms: target of f must equal source of g');
  }
  
  return {
    source: f.source,
    target: g.target,
    transform: (t: Tensor) => g.transform(f.transform(t)),
    fiberTransform: (f.fiberTransform && g.fiberTransform)
      ? (fiber: FiberBundle) => g.fiberTransform!(f.fiberTransform!(fiber))
      : undefined,
  };
}

/**
 * Identity morphism for a Nestor.
 */
export function identityMorphism(nestor: Nestor): NestorMorphism {
  return {
    source: nestor,
    target: nestor,
    transform: (t: Tensor) => clone(t),
    fiberTransform: (f: FiberBundle) => ({ ...f, fiberData: clone(f.fiberData) }),
  };
}

/**
 * Create a Nestor morphism from a tensor transformation function.
 */
export function createNestorMorphism(
  source: Nestor,
  target: Nestor,
  transform: (t: Tensor) => Tensor
): NestorMorphism {
  return {
    source,
    target,
    transform,
  };
}

/**
 * Check if a morphism preserves the Nestor structure (is a valid arrow).
 */
export function isStructurePreserving(morphism: NestorMorphism): boolean {
  // Check that children are preserved
  if (morphism.source.children.length !== morphism.target.children.length) {
    return false;
  }
  
  // Check that types are compatible
  if (morphism.source.typeInfo.nodeType !== morphism.target.typeInfo.nodeType) {
    return false;
  }
  
  return true;
}
