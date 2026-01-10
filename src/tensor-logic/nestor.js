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
import { createTensor, einsum, clone, } from './core';
/**
 * Create a new Nestor node
 */
export function createNestor(id, tensor, typeInfo, children = []) {
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
export function createFiberBundle(baseId, fiberDim, fiberData) {
    const fiber = fiberData || createTensor(`fiber_${baseId}`, ['f'], [fiberDim], 'random');
    return {
        baseId,
        fiberDim,
        fiberData: fiber,
    };
}
/**
 * Attach a fiber bundle to a Nestor
 */
export function attachFiberBundle(nestor, fiber) {
    return {
        ...nestor,
        fiber,
    };
}
/**
 * Compute the depth of a Nestor hypertree
 */
export function nestorDepth(nestor) {
    if (nestor.children.length === 0) {
        return 1;
    }
    return 1 + Math.max(...nestor.children.map(nestorDepth));
}
/**
 * Count total nodes in a Nestor hypertree
 */
export function nestorNodeCount(nestor) {
    return 1 + nestor.children.reduce((sum, child) => sum + nestorNodeCount(child), 0);
}
/**
 * Traverse a Nestor hypertree with a visitor function
 */
export function traverseNestor(nestor, visitor, depth = 0) {
    visitor(nestor, depth);
    nestor.children.forEach(child => traverseNestor(child, visitor, depth + 1));
}
/**
 * Map a function over all tensors in a Nestor hypertree
 */
export function mapNestorTensors(nestor, fn) {
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
export function aggregateNestor(nestor, aggregator) {
    const childResults = nestor.children.map(child => aggregateNestor(child, aggregator));
    return aggregator(nestor.tensor, childResults);
}
/**
 * Create a gauge connection for parallel transport between Nestors.
 * The connection defines how tensors are transported along edges.
 */
export function createGaugeConnection(connectionForm, computeCurvature = false) {
    // Covariant derivative: ∇_X Y = dY(X) + [A, Y]
    // where A is the connection form
    const covariantDerivative = (tensor, _direction) => {
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
function computeCurvatureTensor(connectionForm) {
    // For a U(1) gauge theory, F = dA
    // For non-abelian, F = dA + A ∧ A
    // Simplified version: just return the connection form squared
    return einsum('ij,jk->ik', connectionForm, connectionForm);
}
/**
 * Parallel transport a tensor along an edge using the gauge connection.
 */
export function parallelTransport(tensor, connection, path) {
    return connection.covariantDerivative(tensor, path);
}
/**
 * Compute smooth differential gradients through a Nestor hypertree.
 * This enables backpropagation through the nested structure.
 */
export function computeNestorGradient(nestor, loss, epsilon = 1e-5) {
    const gradients = new Map();
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
function numericalGradient(tensor, loss, epsilon = 1e-5) {
    const grad = createTensor(`grad_${tensor.name}`, tensor.indices, tensor.shape, 'zeros');
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
export function gaugeTransform(nestor, gauge) {
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
export function composeMorphisms(f, g) {
    if (f.target.id !== g.source.id) {
        throw new Error('Cannot compose morphisms: target of f must equal source of g');
    }
    return {
        source: f.source,
        target: g.target,
        transform: (t) => g.transform(f.transform(t)),
        fiberTransform: (f.fiberTransform && g.fiberTransform)
            ? (fiber) => g.fiberTransform(f.fiberTransform(fiber))
            : undefined,
    };
}
/**
 * Identity morphism for a Nestor.
 */
export function identityMorphism(nestor) {
    return {
        source: nestor,
        target: nestor,
        transform: (t) => clone(t),
        fiberTransform: (f) => ({ ...f, fiberData: clone(f.fiberData) }),
    };
}
/**
 * Create a Nestor morphism from a tensor transformation function.
 */
export function createNestorMorphism(source, target, transform) {
    return {
        source,
        target,
        transform,
    };
}
/**
 * Check if a morphism preserves the Nestor structure (is a valid arrow).
 */
export function isStructurePreserving(morphism) {
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
