# Neural Nestor Gauge Logic Framework

This document describes the Neural Nestor Gauge Logic framework - an extension of Tensor Logic that adds hierarchical structure, fiber bundles, gauge connections, and categorical semantics.

## Overview

The Neural Nestor Gauge Logic framework extends Pedro Domingos' Tensor Logic with:

1. **Nestors**: Nested tensors forming rooted hypertrees with fiber bundle hypernodes
2. **Tensor Embeddings**: Shape fiber forest features of typed hyper-graph neural networks
3. **Smooth Differential Gradients**: Categorical logic of a generalized gauge transformer
4. **Neural Nestor Morph Logic**: The unified mathematical object

## Mathematical Foundation

### 1. Nestors

A **Nestor** is a nested tensor structure that forms a rooted hypertree:

```typescript
interface Nestor {
  id: string;
  tensor: Tensor;
  children: Nestor[];
  fiber?: FiberBundle;
  typeInfo: NestorType;
}
```

**Key Properties:**
- Hierarchical composition: Nestors can contain child Nestors
- Forms a rooted tree where each node is a hypergraph
- Enables multi-scale reasoning across different levels of abstraction

### 2. Fiber Bundles

A **Fiber Bundle** attaches a vector space to each node in the hypertree:

```typescript
interface FiberBundle {
  baseId: string;
  fiberDim: number;
  fiberData: Tensor;
  connection?: Tensor;
}
```

**Mathematical Interpretation:**
- **Base space**: The graph/hypertree structure
- **Fiber**: Vector space attached to each node
- **Connection**: Defines parallel transport across edges
- Enables smooth transformations across the hierarchical structure

### 3. Gauge Connections

A **Gauge Connection** defines how to parallel transport tensors along edges:

```typescript
interface GaugeConnection {
  connectionForm: Tensor;
  curvature?: Tensor;
  covariantDerivative: (tensor: Tensor, direction: Tensor) => Tensor;
}
```

**Key Concepts:**
- **Connection 1-form**: Defines parallel transport
- **Curvature 2-form**: Measures non-commutativity
- **Covariant derivative**: ∇_X Y = dY(X) + [A, Y]

### 4. Categorical Structure

Nestors form a **category** where:

- **Objects**: Nestors (nested tensor hypertrees)
- **Morphisms**: Structure-preserving transformations
- **Composition**: Associative composition of morphisms
- **Identity**: Identity morphism for each Nestor

**Category Laws:**
```typescript
// Left identity: id ∘ f = f
// Right identity: f ∘ id = f
// Associativity: (h ∘ g) ∘ f = h ∘ (g ∘ f)
```

### 5. Functors

**Functors** map between categories while preserving structure:

```typescript
interface Functor {
  mapObject: (nestor: Nestor) => Nestor;
  mapMorphism: (morphism: NestorMorphism) => NestorMorphism;
}
```

**Properties:**
- Preserves identity morphisms
- Preserves composition

## Neural Nestor Morph Logic

The complete framework combines all these elements into a unified system:

```typescript
interface TypedHyperGraphNN {
  forest: FiberForest;           // Collection of Nestor trees
  encoder: GaugeTransformer;     // Attention with gauge structure
  decoder: NeuralNestor;         // Learnable output layer
  context: CategoricalContext;   // Category-theoretic bookkeeping
}
```

### Forward Pass Pipeline

1. **Embed** inputs in the fiber forest
2. **Encode** with gauge transformer attention
3. **Aggregate** attended representations
4. **Decode** to output space

### Key Features

- **Typed reasoning**: Type system for hyper-graph nodes
- **Smooth gradients**: Gauge connections ensure differentiability
- **Compositional**: Categorical structure enables reasoning about compositions
- **Multi-scale**: Hierarchical Nestors capture different abstraction levels

## Example: Knowledge Graph Reasoning

```typescript
// Create type system
const personType = { nodeType: 'Person', edgeTypes: ['worksIn'], ... };
const teamType = { nodeType: 'Team', edgeTypes: ['partOf', 'hasMember'], ... };

// Build hypertree
const alice = createNestor('alice', features, personType);
const team = createNestor('team', features, teamType, [alice, bob]);

// Attach fiber bundles
const aliceWithFiber = attachFiberBundle(alice, fiberBundle);

// Create fiber forest and network
const forest = createFiberForest([rootNestor], embeddingDim);
const network = createTypedHyperGraphNN(forest, hiddenDim, outputDim);

// Forward pass
const output = neuralNestorMorphForward(network, inputs);
```

## Formal Verification with Lean 4

The framework includes formal verification in Lean 4:

- **Tensor foundations**: Formalized tensors as multi-dimensional arrays
- **Nestor structure**: Proved Nestors form valid tree structures
- **Category laws**: Verified identity, associativity, and functoriality
- **Type safety**: Proved operations preserve type signatures

See [lean/README.md](../lean/README.md) for details.

## API Reference

### Core Functions

#### Creating Nestors

```typescript
createNestor(id: string, tensor: Tensor, typeInfo: NestorType, children?: Nestor[]): Nestor
```

#### Fiber Bundles

```typescript
createFiberBundle(baseId: string, fiberDim: number, fiberData?: Tensor): FiberBundle
attachFiberBundle(nestor: Nestor, fiber: FiberBundle): Nestor
```

#### Gauge Connections

```typescript
createGaugeConnection(connectionForm: Tensor, computeCurvature?: boolean): GaugeConnection
parallelTransport(tensor: Tensor, connection: GaugeConnection, path: Tensor): Tensor
```

#### Morphisms

```typescript
createNestorMorphism(source: Nestor, target: Nestor, transform: Function): NestorMorphism
composeMorphisms(f: NestorMorphism, g: NestorMorphism): NestorMorphism
identityMorphism(nestor: Nestor): NestorMorphism
```

#### Neural Networks

```typescript
createNeuralNestor(id: string, tensor: Tensor, typeInfo: NestorType, activation?: Function): NeuralNestor
createGaugeTransformer(numHeads: number, headDim: number, modelDim: number): GaugeTransformer
createTypedHyperGraphNN(forest: FiberForest, hiddenDim: number, outputDim: number): TypedHyperGraphNN
neuralNestorMorphForward(network: TypedHyperGraphNN, inputs: Nestor[]): Tensor
```

## Use Cases

1. **Hierarchical Knowledge Graphs**: Organizations, departments, teams, people
2. **Program Analysis**: ASTs with semantic information at each level
3. **Molecular Modeling**: Proteins, domains, residues, atoms
4. **Document Understanding**: Documents, sections, paragraphs, sentences
5. **Software Systems**: Systems, modules, classes, functions

## Extensions

Possible future extensions:

1. **Higher Categories**: n-categories with higher morphisms
2. **Quantum Nestors**: Quantum state spaces as fibers
3. **Temporal Dynamics**: Time-evolving Nestor structures
4. **Stochastic Processes**: Probabilistic Nestors
5. **Geometric Deep Learning**: General manifold structures

## References

1. Domingos, P. (2025). *Tensor Logic: The Language of AI*. arXiv:2510.12269
2. Atiyah, M. (1989). *K-Theory*. CRC Press.
3. Mac Lane, S. (1971). *Categories for the Working Mathematician*. Springer.
4. Baez, J. C., & Stay, M. (2010). *Physics, topology, logic and computation: a Rosetta Stone*. arXiv:0903.0340
5. Bronstein, M. M., et al. (2021). *Geometric deep learning: Grids, groups, graphs, geodesics, and gauges*. arXiv:2104.13478

## License

MIT
