/**
 * NEURAL NESTOR MORPH LOGIC EXAMPLE
 * 
 * This example demonstrates the complete Neural Nestor Morph Logic framework,
 * showing how nestors, fiber bundles, gauge connections, and categorical
 * morphisms work together to create a unified framework for reasoning.
 * 
 * SCENARIO: Knowledge Graph Reasoning with Hierarchical Structure
 * 
 * We model a knowledge graph where entities have hierarchical structure:
 * - Organizations contain departments
 * - Departments contain teams
 * - Teams contain people
 * 
 * Each level has its own tensor representation (fiber bundle), and we use
 * gauge connections to smoothly propagate information across levels.
 */

import {
  Tensor,
  fromVector,
  tensorToString,
} from '../core';

import {
  NestorType,
  createNestor,
  createFiberBundle,
  attachFiberBundle,
  traverseNestor,
  nestorDepth,
  nestorNodeCount,
} from '../nestor';

import {
  createFiberForest,
  embedNestorInForest,
  createTypedHyperGraphNN,
  neuralNestorMorphForward,
  addObject,
  createCategoricalContext,
} from '../neural-nestor-morph';

export interface NeuralNestorMorphResult {
  title: string;
  description: string;
  code: string;
  steps: {
    name: string;
    explanation: string;
    tensor?: Tensor;
    tensorString?: string;
    nestorInfo?: {
      id: string;
      depth: number;
      nodeCount: number;
      hasChildren: boolean;
      hasFiber: boolean;
    };
  }[];
}

/**
 * Run the Neural Nestor Morph Logic example.
 */
export function runNeuralNestorMorphExample(): NeuralNestorMorphResult {
  const steps: NeuralNestorMorphResult['steps'] = [];
  
  // Step 1: Create type system for the knowledge graph
  const personType: NestorType = {
    nodeType: 'Person',
    edgeTypes: ['worksIn'],
    signature: {
      inputShape: [3],
      outputShape: [3],
      indices: ['p'],
    },
  };
  
  const teamType: NestorType = {
    nodeType: 'Team',
    edgeTypes: ['partOf', 'hasMember'],
    signature: {
      inputShape: [5],
      outputShape: [5],
      indices: ['t'],
    },
  };
  
  const deptType: NestorType = {
    nodeType: 'Department',
    edgeTypes: ['partOf', 'hasTeam'],
    signature: {
      inputShape: [7],
      outputShape: [7],
      indices: ['d'],
    },
  };
  
  const orgType: NestorType = {
    nodeType: 'Organization',
    edgeTypes: ['hasDepartment'],
    signature: {
      inputShape: [10],
      outputShape: [10],
      indices: ['o'],
    },
  };
  
  steps.push({
    name: 'Type System Definition',
    explanation: `Defined a type system for a hierarchical knowledge graph:
- Person (3D features): individual employees
- Team (5D features): groups of people
- Department (7D features): organizational units
- Organization (10D features): top-level entities

Each type has a signature specifying input/output shapes and edge types.
This enables typed reasoning over the hyper-graph structure.`,
  });
  
  // Step 2: Create Nestors for entities
  
  // People
  const alice = createNestor(
    'alice',
    fromVector('alice_features', 'p', [0.8, 0.9, 0.7]),
    personType
  );
  
  const bob = createNestor(
    'bob',
    fromVector('bob_features', 'p', [0.6, 0.8, 0.9]),
    personType
  );
  
  const charlie = createNestor(
    'charlie',
    fromVector('charlie_features', 'p', [0.9, 0.7, 0.8]),
    personType
  );
  
  // Team with people as children
  const aiTeam = createNestor(
    'ai_team',
    fromVector('ai_team_features', 't', [0.9, 0.8, 0.85, 0.9, 0.88]),
    teamType,
    [alice, bob]
  );
  
  const dataTeam = createNestor(
    'data_team',
    fromVector('data_team_features', 't', [0.85, 0.9, 0.8, 0.87, 0.9]),
    teamType,
    [charlie]
  );
  
  steps.push({
    name: 'Entity Nestors Created',
    explanation: `Created Nestor nodes for entities:
- 3 people: Alice, Bob, Charlie (leaf nodes)
- 2 teams: AI Team (contains Alice, Bob), Data Team (contains Charlie)

Each Nestor has:
- Unique ID
- Feature vector (tensor data)
- Type information
- Children (forming the hypertree structure)`,
    nestorInfo: {
      id: aiTeam.id,
      depth: nestorDepth(aiTeam),
      nodeCount: nestorNodeCount(aiTeam),
      hasChildren: aiTeam.children.length > 0,
      hasFiber: !!aiTeam.fiber,
    },
  });
  
  // Department with teams as children
  const engineeringDept = createNestor(
    'engineering',
    fromVector('eng_dept_features', 'd', [0.9, 0.85, 0.9, 0.88, 0.87, 0.9, 0.86]),
    deptType,
    [aiTeam, dataTeam]
  );
  
  // Organization with department as child
  const techCorp = createNestor(
    'techcorp',
    fromVector('techcorp_features', 'o', [0.95, 0.9, 0.88, 0.92, 0.89, 0.91, 0.9, 0.87, 0.93, 0.88]),
    orgType,
    [engineeringDept]
  );
  
  steps.push({
    name: 'Hierarchical Structure Complete',
    explanation: `Built complete organizational hierarchy:

TechCorp (Organization)
  └── Engineering (Department)
       ├── AI Team
       │    ├── Alice (Person)
       │    └── Bob (Person)
       └── Data Team
            └── Charlie (Person)

This forms a rooted hypertree with 6 nodes across 4 levels.`,
    nestorInfo: {
      id: techCorp.id,
      depth: nestorDepth(techCorp),
      nodeCount: nestorNodeCount(techCorp),
      hasChildren: techCorp.children.length > 0,
      hasFiber: !!techCorp.fiber,
    },
  });
  
  // Step 3: Attach fiber bundles
  const aliceFiber = createFiberBundle('alice', 3);
  const bobFiber = createFiberBundle('bob', 3);
  const charlieFiber = createFiberBundle('charlie', 3);
  const aiTeamFiber = createFiberBundle('ai_team', 5);
  const dataTeamFiber = createFiberBundle('data_team', 5);
  const engFiber = createFiberBundle('engineering', 7);
  const techCorpFiber = createFiberBundle('techcorp', 10);
  
  const aliceWithFiber = attachFiberBundle(alice, aliceFiber);
  const bobWithFiber = attachFiberBundle(bob, bobFiber);
  const charlieWithFiber = attachFiberBundle(charlie, charlieFiber);
  
  const aiTeamWithFiber = attachFiberBundle(
    { ...aiTeam, children: [aliceWithFiber, bobWithFiber] },
    aiTeamFiber
  );
  
  const dataTeamWithFiber = attachFiberBundle(
    { ...dataTeam, children: [charlieWithFiber] },
    dataTeamFiber
  );
  
  const engWithFiber = attachFiberBundle(
    { ...engineeringDept, children: [aiTeamWithFiber, dataTeamWithFiber] },
    engFiber
  );
  
  const techCorpWithFiber = attachFiberBundle(
    { ...techCorp, children: [engWithFiber] },
    techCorpFiber
  );
  
  steps.push({
    name: 'Fiber Bundles Attached',
    explanation: `Attached fiber bundles to each Nestor:

A fiber bundle is a vector space attached to each node in the hypertree.
It provides geometric structure and enables:
- Smooth transformations across levels
- Parallel transport of information
- Gauge-theoretic reasoning

Each fiber has the same dimension as the node's feature space.`,
    tensor: techCorpFiber.fiberData,
    tensorString: tensorToString(techCorpFiber.fiberData, 3),
    nestorInfo: {
      id: techCorpWithFiber.id,
      depth: nestorDepth(techCorpWithFiber),
      nodeCount: nestorNodeCount(techCorpWithFiber),
      hasChildren: true,
      hasFiber: true,
    },
  });
  
  // Step 4: Create fiber forest
  const embeddingDim = 16;
  const typeSystem = new Map<string, NestorType>([
    ['Person', personType],
    ['Team', teamType],
    ['Department', deptType],
    ['Organization', orgType],
  ]);
  
  const forest = createFiberForest(
    [techCorpWithFiber],
    embeddingDim,
    typeSystem
  );
  
  steps.push({
    name: 'Fiber Forest Created',
    explanation: `Created a Fiber Forest containing the organizational hypertree:

Embedding dimension: ${embeddingDim}
Number of types: ${typeSystem.size}
Root nodes: ${forest.roots.length}

The fiber forest provides:
- Global embedding space for all entities
- Type system for typed reasoning
- Context for gauge transformations`,
  });
  
  // Step 5: Embed entities
  const techCorpEmbedding = embedNestorInForest(techCorpWithFiber, forest);
  
  steps.push({
    name: 'Tensor Embeddings',
    explanation: `Embedded entities into ${embeddingDim}-dimensional space:

Each embedding combines:
1. Random initialization (node-specific)
2. Type information (from type system)
3. Fiber bundle data (geometric structure)

This creates a unified representation for reasoning across the hierarchy.`,
    tensor: techCorpEmbedding,
    tensorString: tensorToString(techCorpEmbedding, 3),
  });
  
  // Step 6: Create Neural Nestor Morph Logic network
  const network = createTypedHyperGraphNN(forest, 32, 8);
  
  steps.push({
    name: 'Neural Nestor Network',
    explanation: `Created a complete Neural Nestor Morph Logic network:

Components:
1. Fiber Forest: ${forest.roots.length} root(s), ${embeddingDim}D embeddings
2. Gauge Transformer Encoder: 4 attention heads, 32D hidden
3. Neural Nestor Decoder: 32D → 8D output
4. Categorical Context: tracks objects and morphisms

The network forms a category where:
- Objects: Nestors (entities in the knowledge graph)
- Morphisms: Structure-preserving transformations
- Composition: Functorial composition of transformations`,
  });
  
  // Step 7: Forward pass
  const inputNestors = [aliceWithFiber, bobWithFiber, charlieWithFiber];
  const output = neuralNestorMorphForward(network, inputNestors);
  
  steps.push({
    name: 'Forward Pass Output',
    explanation: `Performed forward pass through the network:

Input: 3 person Nestors (Alice, Bob, Charlie)

Pipeline:
1. Embed each person in the fiber forest (16D)
2. Apply gauge transformer attention
   - 4 heads learn different aspects of relationships
   - Gauge connection ensures smooth gradients
3. Aggregate attended representations
4. Decode to 8D output space

The output represents a learned aggregate embedding of the team.`,
    tensor: output,
    tensorString: tensorToString(output, 3),
  });
  
  // Step 8: Categorical structure
  const context = createCategoricalContext();
  
  // Add all entities as objects
  traverseNestor(techCorpWithFiber, (nestor) => {
    addObject(context, nestor);
  });
  
  steps.push({
    name: 'Categorical Context',
    explanation: `Built categorical context:

Objects: ${context.objects.size} Nestors
Morphisms: ${context.morphisms.size} (including identities)
Functors: ${context.functors.size}

The categorical structure ensures:
- Compositionality: morphisms compose associatively
- Identity: each object has an identity morphism
- Functoriality: structure-preserving maps between categories

This enables rigorous mathematical reasoning about the knowledge graph.`,
  });
  
  const code = `// Create type system
const personType = { nodeType: 'Person', ... };
const teamType = { nodeType: 'Team', ... };

// Build hypertree
const alice = createNestor('alice', features, personType);
const team = createNestor('team', features, teamType, [alice, bob]);

// Attach fiber bundles
const aliceWithFiber = attachFiberBundle(alice, fiberBundle);

// Create fiber forest and embed
const forest = createFiberForest([root], embeddingDim);
const embedding = embedNestorInForest(nestor, forest);

// Create network
const network = createTypedHyperGraphNN(forest, hiddenDim, outputDim);

// Forward pass
const output = neuralNestorMorphForward(network, inputs);`;
  
  return {
    title: 'Neural Nestor Morph Logic',
    description: `A unified framework combining:
- Nestors: nested tensors as rooted hypertrees
- Fiber Bundles: geometric structure at each node
- Gauge Connections: smooth differential structure
- Neural Networks: learnable transformations
- Category Theory: compositional reasoning

This extends Tensor Logic with hierarchical structure, enabling reasoning
over complex knowledge graphs with typed hyper-graph neural networks.`,
    code,
    steps,
  };
}
