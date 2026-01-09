/**
 * NEURAL NESTOR MORPH LOGIC
 * 
 * The complete mathematical framework unifying:
 * - Nestors: nested tensors as rooted hypertrees with fiber bundles
 * - Neural networks: differentiable transformations
 * - Category theory: morphisms and functors
 * - Gauge theory: smooth differential structure
 * - Graph neural networks: typed hyper-graph embeddings
 * 
 * THEORETICAL FOUNDATION:
 * 
 * Neural Nestor Morph Logic forms a category where:
 * - Objects: Nestors (nested tensor hypertrees with fiber bundles)
 * - Morphisms: Structure-preserving tensor transformations
 * - Composition: Functorial composition of morphisms
 * - Identity: Identity transformation on each Nestor
 * 
 * This extends Tensor Logic by adding:
 * 1. Hierarchical structure (hypertrees)
 * 2. Fiber bundles (geometric structure)
 * 3. Gauge connections (differential structure)
 * 4. Type system (typed hyper-graphs)
 * 5. Categorical semantics (morphisms and functors)
 */

import {
  Tensor,
  createTensor,
  einsum,
  add,
  relu,
  softmax,
} from './core';

import {
  Nestor,
  NestorType,
  NestorMorphism,
  GaugeConnection,
  createNestor,
  createGaugeConnection,
  parallelTransport,
  composeMorphisms,
  identityMorphism,
  mapNestorTensors,
} from './nestor';

/**
 * Neural Nestor: A Nestor with learnable parameters and activation functions.
 * This is a neural network organized as a nested hypertree structure.
 */
export interface NeuralNestor extends Nestor {
  /** Activation function for this layer */
  activation?: (t: Tensor) => Tensor;
  
  /** Learnable weight matrices */
  weights?: Map<string, Tensor>;
  
  /** Bias tensors */
  biases?: Map<string, Tensor>;
  
  /** Training state */
  trainable: boolean;
}

/**
 * Fiber Forest: A collection of fiber bundles forming a forest structure.
 * This enables tensor embeddings across multiple hypertrees.
 */
export interface FiberForest {
  /** Root Nestors in the forest */
  roots: Nestor[];
  
  /** Global gauge connection across the forest */
  globalConnection?: GaugeConnection;
  
  /** Embedding space dimension */
  embeddingDim: number;
  
  /** Type system for the forest */
  typeSystem: Map<string, NestorType>;
}

/**
 * Gauge Transformer: A transformer architecture with gauge-theoretic structure.
 * Combines attention mechanisms with gauge connections for smooth gradients.
 */
export interface GaugeTransformer {
  /** Number of attention heads */
  numHeads: number;
  
  /** Dimension of each head */
  headDim: number;
  
  /** Query, Key, Value projections */
  projections: {
    query: Tensor;
    key: Tensor;
    value: Tensor;
  };
  
  /** Gauge connection for the transformer */
  connection: GaugeConnection;
  
  /** Output projection */
  outputProjection: Tensor;
}

/**
 * Categorical Logic Context: Maintains the categorical structure.
 * Tracks objects, morphisms, and composition rules.
 */
export interface CategoricalContext {
  /** Objects (Nestors) in the category */
  objects: Map<string, Nestor>;
  
  /** Morphisms between objects */
  morphisms: Map<string, NestorMorphism>;
  
  /** Composition rules and caching */
  compositions: Map<string, NestorMorphism>;
  
  /** Functors to other categories */
  functors: Map<string, Functor>;
}

/**
 * Functor: Maps between categories while preserving structure.
 */
export interface Functor {
  /** Name of the functor */
  name: string;
  
  /** Map objects to objects */
  mapObject: (nestor: Nestor) => Nestor;
  
  /** Map morphisms to morphisms */
  mapMorphism: (morphism: NestorMorphism) => NestorMorphism;
}

/**
 * Create a Neural Nestor with learnable parameters.
 */
export function createNeuralNestor(
  id: string,
  tensor: Tensor,
  typeInfo: NestorType,
  activation?: (t: Tensor) => Tensor,
  trainable = true
): NeuralNestor {
  return {
    id,
    tensor,
    children: [],
    typeInfo,
    activation,
    weights: new Map(),
    biases: new Map(),
    trainable,
  };
}

/**
 * Forward pass through a Neural Nestor.
 * Applies transformations recursively through the hypertree.
 */
export function neuralNestorForward(
  nestor: NeuralNestor,
  input: Tensor
): Tensor {
  let output = input;
  
  // Apply weights if present
  if (nestor.weights && nestor.weights.size > 0) {
    const weight = nestor.weights.values().next().value;
    if (weight && weight.indices.length >= 2) {
      // Simple matrix multiplication: input @ weight
      const notation = `${input.indices.join('')},${weight.indices.join('')}->${weight.indices[1]}`;
      output = einsum(notation, output, weight);
    }
  }
  
  // Apply bias if present
  if (nestor.biases && nestor.biases.size > 0) {
    const bias = nestor.biases.values().next().value;
    if (bias) {
      output = add(output, bias);
    }
  }
  
  // Apply activation
  if (nestor.activation) {
    output = nestor.activation(output);
  }
  
  // Recursively process children if present
  if (nestor.children.length > 0) {
    const childOutputs = nestor.children.map(child =>
      neuralNestorForward(child as NeuralNestor, output)
    );
    
    // Aggregate child outputs (simple average)
    if (childOutputs.length > 0) {
      output = childOutputs.reduce((sum, t) => add(sum, t));
      // Average by dividing each element
      const avgData = new Float64Array(output.data.map(v => v / childOutputs.length));
      output = { ...output, data: avgData };
    }
  }
  
  return output;
}

/**
 * Create a fiber forest from multiple root Nestors.
 */
export function createFiberForest(
  roots: Nestor[],
  embeddingDim: number,
  typeSystem?: Map<string, NestorType>
): FiberForest {
  return {
    roots,
    embeddingDim,
    typeSystem: typeSystem || new Map(),
  };
}

/**
 * Embed a Nestor into a fiber forest.
 * Creates tensor embeddings that capture the hierarchical structure.
 */
export function embedNestorInForest(
  nestor: Nestor,
  forest: FiberForest
): Tensor {
  const embeddingDim = forest.embeddingDim;
  
  // Create embedding tensor
  const embedding = createTensor(
    `embedding_${nestor.id}`,
    ['e'],
    [embeddingDim],
    'random'
  );
  
  // Incorporate type information
  const typeEmbedding = getTypeEmbedding(nestor.typeInfo, embeddingDim);
  
  // Combine node embedding with type embedding
  const combined = add(embedding, typeEmbedding);
  
  // If fiber bundle exists, incorporate fiber information
  if (nestor.fiber) {
    const fiberEmbedding = createTensor(
      `fiber_emb_${nestor.id}`,
      ['e'],
      [embeddingDim],
      'zeros'
    );
    
    // Copy fiber data into embedding (with dimension matching and bounds checking)
    const minDim = Math.min(embeddingDim, nestor.fiber.fiberDim, nestor.fiber.fiberData.data.length);
    for (let i = 0; i < minDim; i++) {
      fiberEmbedding.data[i] = nestor.fiber.fiberData.data[i];
    }
    
    return add(combined, fiberEmbedding);
  }
  
  return combined;
}

/**
 * Get embedding for a Nestor type.
 */
function getTypeEmbedding(typeInfo: NestorType, embeddingDim: number): Tensor {
  // Simple hash-based type embedding
  const typeHash = hashString(typeInfo.nodeType);
  const embedding = createTensor(
    `type_emb_${typeInfo.nodeType}`,
    ['e'],
    [embeddingDim],
    'zeros'
  );
  
  // Fill embedding based on type hash
  for (let i = 0; i < embeddingDim; i++) {
    embedding.data[i] = Math.sin(typeHash + i) * 0.1;
  }
  
  return embedding;
}

/**
 * Simple string hash function.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Create a Gauge Transformer for attention over Nestors.
 */
export function createGaugeTransformer(
  numHeads: number,
  headDim: number,
  modelDim: number
): GaugeTransformer {
  const totalDim = numHeads * headDim;
  
  // Initialize projection matrices
  const query = createTensor(
    'query_proj',
    ['m', 'h'],
    [modelDim, totalDim],
    'random'
  );
  
  const key = createTensor(
    'key_proj',
    ['m', 'h'],
    [modelDim, totalDim],
    'random'
  );
  
  const value = createTensor(
    'value_proj',
    ['m', 'h'],
    [modelDim, totalDim],
    'random'
  );
  
  // Output projection
  const outputProjection = createTensor(
    'output_proj',
    ['h', 'm'],
    [totalDim, modelDim],
    'random'
  );
  
  // Create gauge connection for smooth attention
  const connectionForm = createTensor(
    'attention_connection',
    ['h', 'h'],
    [totalDim, totalDim],
    'random'
  );
  
  const connection = createGaugeConnection(connectionForm, true);
  
  return {
    numHeads,
    headDim,
    projections: { query, key, value },
    connection,
    outputProjection,
  };
}

/**
 * Apply gauge transformer attention to a sequence of Nestors.
 */
export function gaugeTransformerAttention(
  transformer: GaugeTransformer,
  nestors: Nestor[]
): Tensor[] {
  const { projections, connection } = transformer;
  
  // Extract embeddings from each Nestor
  const embeddings = nestors.map(n => n.tensor);
  
  // Apply projections to get Q, K, V
  const queries = embeddings.map(e => {
    const notation = `${e.indices.join('')},${projections.query.indices.join('')}->${projections.query.indices[1]}`;
    return einsum(notation, e, projections.query);
  });
  const keys = embeddings.map(e => {
    const notation = `${e.indices.join('')},${projections.key.indices.join('')}->${projections.key.indices[1]}`;
    return einsum(notation, e, projections.key);
  });
  const values = embeddings.map(e => {
    const notation = `${e.indices.join('')},${projections.value.indices.join('')}->${projections.value.indices[1]}`;
    return einsum(notation, e, projections.value);
  });
  
  // Compute attention scores with gauge connection
  const attended = queries.map((q) => {
    // Compute attention scores for this query
    const scoreValues: number[] = [];
    for (const k of keys) {
      // Dot product: sum over all indices
      const notation = `${q.indices.join('')},${k.indices.join('')}->`;
      const score = einsum(notation, q, k);
      // Extract the scalar value (einsum with empty output produces a scalar in data[0])
      scoreValues.push(score.data[0] || 0);
    }
    
    // Apply softmax to get attention weights
    const scoresVec = createTensor('scores', ['k'], [scoreValues.length], 
      new Float64Array(scoreValues));
    const weights = softmax(scoresVec);
    
    // Apply attention weights to values
    let attended = createTensor('attended', ['v'], [values[0].shape[0]], 'zeros');
    for (let j = 0; j < values.length; j++) {
      const weighted = createTensor(
        'weighted',
        values[j].indices,
        values[j].shape,
        new Float64Array(values[j].data.map(v => v * weights.data[j]))
      );
      attended = add(attended, weighted);
    }
    
    // Apply gauge connection for parallel transport
    return parallelTransport(attended, connection, q);
  });
  
  // Apply output projection
  return attended.map(a => {
    const notation = `${a.indices.join('')},${transformer.outputProjection.indices.join('')}->${transformer.outputProjection.indices[1]}`;
    return einsum(notation, a, transformer.outputProjection);
  });
}

/**
 * Create a categorical context for Neural Nestor Morph Logic.
 */
export function createCategoricalContext(): CategoricalContext {
  return {
    objects: new Map(),
    morphisms: new Map(),
    compositions: new Map(),
    functors: new Map(),
  };
}

/**
 * Add an object (Nestor) to the categorical context.
 */
export function addObject(context: CategoricalContext, nestor: Nestor): void {
  context.objects.set(nestor.id, nestor);
  
  // Add identity morphism
  const identity = identityMorphism(nestor);
  context.morphisms.set(`id_${nestor.id}`, identity);
}

/**
 * Add a morphism to the categorical context.
 */
export function addMorphism(
  context: CategoricalContext,
  name: string,
  morphism: NestorMorphism
): void {
  context.morphisms.set(name, morphism);
}

/**
 * Compose morphisms in the categorical context with caching.
 */
export function composeInContext(
  context: CategoricalContext,
  f: string,
  g: string
): NestorMorphism {
  const cacheKey = `${f}_∘_${g}`;
  
  // Check cache
  if (context.compositions.has(cacheKey)) {
    return context.compositions.get(cacheKey)!;
  }
  
  // Get morphisms
  const morphF = context.morphisms.get(f);
  const morphG = context.morphisms.get(g);
  
  if (!morphF || !morphG) {
    throw new Error(`Morphisms ${f} or ${g} not found in context`);
  }
  
  // Compose and cache
  const composed = composeMorphisms(morphF, morphG);
  context.compositions.set(cacheKey, composed);
  
  return composed;
}

/**
 * Add a functor to the categorical context.
 */
export function addFunctor(
  context: CategoricalContext,
  functor: Functor
): void {
  context.functors.set(functor.name, functor);
}

/**
 * Create an embedding functor that maps Nestors to their embeddings.
 */
export function createEmbeddingFunctor(
  forest: FiberForest
): Functor {
  return {
    name: 'EmbeddingFunctor',
    mapObject: (nestor: Nestor) => {
      const embedding = embedNestorInForest(nestor, forest);
      return createNestor(
        `embedded_${nestor.id}`,
        embedding,
        nestor.typeInfo,
        []
      );
    },
    mapMorphism: (morphism: NestorMorphism) => {
      // Map the morphism to operate on embeddings
      return {
        ...morphism,
        transform: (t: Tensor) => {
          // Apply original transform in embedding space
          return morphism.transform(t);
        },
      };
    },
  };
}

/**
 * Apply a functor to map objects between categories.
 */
export function applyFunctor(
  functor: Functor,
  nestor: Nestor
): Nestor {
  return functor.mapObject(nestor);
}

/**
 * Create a typed hyper-graph neural network from a fiber forest.
 * This is the complete Neural Nestor Morph Logic pipeline.
 */
export function createTypedHyperGraphNN(
  forest: FiberForest,
  hiddenDim: number,
  outputDim: number
): {
  forest: FiberForest;
  encoder: GaugeTransformer;
  decoder: NeuralNestor;
  context: CategoricalContext;
} {
  const context = createCategoricalContext();
  
  // Create gauge transformer encoder
  const encoder = createGaugeTransformer(
    4, // 4 attention heads
    hiddenDim / 4,
    forest.embeddingDim
  );
  
  // Create decoder Neural Nestor
  const decoderType: NestorType = {
    nodeType: 'decoder',
    edgeTypes: [],
    signature: {
      inputShape: [hiddenDim],
      outputShape: [outputDim],
      indices: ['h', 'o'],
    },
  };
  
  const decoder = createNeuralNestor(
    'decoder',
    createTensor('decoder_tensor', ['o'], [outputDim], 'zeros'),
    decoderType,
    relu,
    true
  );
  
  // Add weights to decoder
  decoder.weights!.set(
    'W',
    createTensor('decoder_W', ['h', 'o'], [hiddenDim, outputDim], 'random')
  );
  decoder.biases!.set(
    'b',
    createTensor('decoder_b', ['o'], [outputDim], 'zeros')
  );
  
  // Register objects in categorical context
  forest.roots.forEach(root => addObject(context, root));
  addObject(context, decoder as Nestor);
  
  // Create embedding functor
  const embeddingFunctor = createEmbeddingFunctor(forest);
  addFunctor(context, embeddingFunctor);
  
  return {
    forest,
    encoder,
    decoder,
    context,
  };
}

/**
 * Full forward pass through the Neural Nestor Morph Logic network.
 */
export function neuralNestorMorphForward(
  network: ReturnType<typeof createTypedHyperGraphNN>,
  inputs: Nestor[]
): Tensor {
  // 1. Embed inputs in the fiber forest
  const embeddings = inputs.map(input => 
    embedNestorInForest(input, network.forest)
  );
  
  // 2. Apply gauge transformer attention
  const embeddedNestors = inputs.map((nestor, i) => ({
    ...nestor,
    tensor: embeddings[i],
  }));
  
  const attended = gaugeTransformerAttention(network.encoder, embeddedNestors);
  
  // 3. Aggregate attended representations
  let aggregated = attended[0];
  for (let i = 1; i < attended.length; i++) {
    aggregated = add(aggregated, attended[i]);
  }
  
  // Average
  aggregated = createTensor(
    'aggregated',
    aggregated.indices,
    aggregated.shape,
    new Float64Array(aggregated.data.map(v => v / attended.length))
  );
  
  // 4. Decode to output
  const output = neuralNestorForward(network.decoder, aggregated);
  
  return output;
}
