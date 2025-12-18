/**
 * GRAPH NEURAL NETWORKS (GNN) IN TENSOR LOGIC
 * 
 * Graph Neural Networks operate on graph-structured data, where nodes have
 * features and edges represent relationships. GNNs learn node representations
 * by aggregating information from neighboring nodes.
 * 
 * THE KEY INSIGHT:
 * Message passing in GNNs is exactly Einstein summation over the graph structure!
 * 
 * Basic GNN layer:
 *   H'[v,d'] = Σ_u A[v,u] · H[u,d] · W[d,d']
 * 
 * Where:
 * - H[v,d] are node features (node v, feature dimension d)
 * - A[v,u] is the adjacency matrix (1 if edge exists, 0 otherwise)
 * - W[d,d'] are learnable weights
 * 
 * This is:
 * 1. For each node v, sum over all neighbors u (where A[v,u] = 1)
 * 2. Multiply neighbor features H[u,d] by weights W[d,d']
 * 3. Aggregate to get new features H'[v,d']
 * 
 * FOR THE MATHEMATICIAN:
 * This is matrix multiplication with the adjacency matrix:
 *   H' = A · H · W
 * 
 * The adjacency matrix A acts as a "selector" - it determines which nodes
 * contribute to each node's representation. This is exactly the same pattern
 * as logical rules: the adjacency matrix is like a relation, and we're
 * aggregating over it.
 * 
 * Graph Attention Networks (GAT) extend this with learned attention weights:
 *   Attention[v,u] = softmax(Query[v,d] · Key[u,d])
 *   H'[v,d'] = Σ_u Attention[v,u] · H[u,d] · W[d,d']
 * 
 * This makes the aggregation adaptive - nodes can learn to focus on
 * more important neighbors, similar to how Transformers use attention.
 */

import {
  Tensor,
  createTensor,
  fromMatrix,
  einsum,
  add,
  relu,
  sigmoid,
  tensorToString,
} from '../core';
import { broadcastMultiply, extractSlice } from '../utils';

export interface GNNResult {
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
 * Example: Simple Graph Neural Network
 * 
 * We'll work with a small graph of 4 nodes representing a social network:
 * - Node 0: Alice
 * - Node 1: Bob
 * - Node 2: Charlie
 * - Node 3: Diana
 * 
 * Edges represent friendships:
 * - Alice ↔ Bob
 * - Bob ↔ Charlie
 * - Bob ↔ Diana
 * 
 * Each node has initial features (e.g., interests, age, etc.)
 * The GNN will update these features by aggregating information from friends.
 */
export function runGNNExample(): GNNResult {
  const steps: GNNResult['steps'] = [];

  // Graph structure: Neig(x, y) is a relation (Boolean tensor)
  // Neig[x,y] = 1 if there's an edge between nodes x and y
  const Neig = fromMatrix('Neig', ['x', 'y'], [
    [0, 1, 0, 0], // Alice connected to Bob
    [1, 0, 1, 1], // Bob connected to Alice, Charlie, Diana
    [0, 1, 0, 0], // Charlie connected to Bob
    [0, 1, 0, 0], // Diana connected to Bob
  ]);

  steps.push({
    name: 'Graph Structure: Neig(x, y)',
    explanation: `The graph structure is encoded as a relation Neig(x, y).

Neig[x,y] = 1 means there's an edge between nodes x and y.

Our social network:
- Node 0 (Alice) ↔ Node 1 (Bob)
- Node 1 (Bob) ↔ Node 2 (Charlie)
- Node 1 (Bob) ↔ Node 3 (Diana)

Bob is the central node, connected to everyone else.

In Tensor Logic notation from the paper:
  Neig(x, y)  // Boolean relation defining graph structure

This acts as a "selector" in Einstein summation - it determines
which nodes contribute to each node's updated representation.`,
    tensor: Neig,
    tensorString: tensorToString(Neig, 0),
  });

  // Initial node features: X[n, d] where n is node, d is feature dimension
  // Initialization: Emb[n, 0, d] = X[n, d]
  const X = createTensor(
    'X',
    ['n', 'd'],
    [4, 3],
    new Float64Array([
      // Alice: [interest_score, activity, age_group]
      0.8, 0.6, 0.3,
      // Bob: central node, high activity
      0.9, 1.0, 0.5,
      // Charlie: lower activity
      0.5, 0.3, 0.4,
      // Diana: similar to Alice
      0.7, 0.5, 0.3,
    ])
  );

  steps.push({
    name: 'Initial Features: X[n, d]',
    explanation: `Initial node features X[n, d] representing node properties.

Node 0 (Alice): [0.8, 0.6, 0.3] - high interest, moderate activity
Node 1 (Bob):   [0.9, 1.0, 0.5] - very active, central in network
Node 2 (Charlie): [0.5, 0.3, 0.4] - lower activity
Node 3 (Diana): [0.7, 0.5, 0.3] - similar to Alice

In Tensor Logic notation from the paper:
  Emb[n, 0, d] = X[n, d]  // Initialization

These features will be updated by aggregating information from
neighboring nodes through message passing.`,
    tensor: X,
    tensorString: tensorToString(X, 2),
  });

  // Initialize embeddings: Emb[n, 0, d] = X[n, d]
  const Emb = createTensor(
    'Emb',
    ['n', 'l', 'd'],
    [4, 1, 3],
    new Float64Array([
      // Layer 0 embeddings (initialized from X)
      0.8, 0.6, 0.3, // Alice
      0.9, 1.0, 0.5, // Bob
      0.5, 0.3, 0.4, // Charlie
      0.7, 0.5, 0.3, // Diana
    ])
  );

  steps.push({
    name: 'Initialization: Emb[n, 0, d] = X[n, d]',
    explanation: `Initialize embeddings from node features.

Tensor Logic (from paper):
  Emb[n, 0, d] = X[n, d]

This sets each node's 0th-layer embeddings to its features.
The network will carry out L iterations of message passing,
one per layer.`,
    tensor: Emb,
    tensorString: tensorToString(Emb, 2),
  });

  // MLP weights: WP[l, d′, d] transforms features
  // For layer 0, we'll use a simple transformation
  const WP = createTensor(
    'WP',
    ['l', 'd_prime', 'd'],
    [1, 3, 3],
    new Float64Array([
      // Transform features: emphasize activity, blend interests
      0.5, 0.3, 0.2, // Output feature 0: blend of all inputs
      0.2, 0.6, 0.2, // Output feature 1: emphasize input feature 1 (activity)
      0.3, 0.1, 0.6, // Output feature 2: emphasize input feature 2 (age)
    ])
  );

  steps.push({
    name: 'MLP: Z[n, l, d′] = relu(WP[l, d′, d] Emb[n, l, d])',
    explanation: `MLP transformation of embeddings.

Tensor Logic (from paper):
  Z[n, l, d′] = relu(WP[l, d′, d] Emb[n, l, d])

This applies a learned linear transformation followed by ReLU
activation to each node's embedding at each layer.

The weights shown here are example values - in practice, these
would be learned through gradient descent.`,
    tensor: WP,
    tensorString: tensorToString(WP, 2),
  });

  // Apply MLP to layer 0 embeddings
  // Z[n, l, d′] = relu(WP[l, d′, d] Emb[n, l, d])
  // Compute manually: for each n, l, d′, sum over d
  const ZData = new Float64Array(4 * 1 * 3);
  for (let n = 0; n < 4; n++) {
    for (let l = 0; l < 1; l++) {
      for (let d_prime = 0; d_prime < 3; d_prime++) {
        let sum = 0;
        for (let d = 0; d < 3; d++) {
          // WP[l, d_prime, d]: shape [1, 3, 3], indices [l, d_prime, d]
          const wpIdx = l * (3 * 3) + d_prime * 3 + d;
          // Emb[n, l, d]: shape [4, 1, 3], indices [n, l, d]
          const embIdx = n * (1 * 3) + l * 3 + d;
          sum += WP.data[wpIdx] * Emb.data[embIdx];
        }
        // Z[n, l, d_prime]: shape [4, 1, 3]
        const zIdx = n * (1 * 3) + l * 3 + d_prime;
        ZData[zIdx] = Math.max(0, sum); // ReLU
      }
    }
  }
  const Z = createTensor('Z', ['n', 'l', 'd'], [4, 1, 3], ZData);

  steps.push({
    name: 'Z[n, l, d′] after MLP',
    explanation: `Transformed embeddings after MLP.

Z[n, l, d′] = relu(WP[l, d′, d] Emb[n, l, d])

This prepares the embeddings for aggregation.`,
    tensor: Z,
    tensorString: tensorToString(Z, 2),
  });

  // Aggregation: Agg[n, l, d] = Neig(n, n′) Z[n′, l, d]
  // Compute manually: for each n, l, d, sum over n′ where Neig[n, n′] = 1
  const AggData = new Float64Array(4 * 1 * 3);
  for (let n = 0; n < 4; n++) {
    for (let l = 0; l < 1; l++) {
      for (let d = 0; d < 3; d++) {
        let sum = 0;
        for (let n_prime = 0; n_prime < 4; n_prime++) {
          // Neig[n, n_prime]: shape [4, 4], indices [x, y]
          const neigIdx = n * 4 + n_prime;
          if (Neig.data[neigIdx] > 0) {
            // Z[n_prime, l, d]: shape [4, 1, 3]
            const zIdx = n_prime * (1 * 3) + l * 3 + d;
            sum += Z.data[zIdx];
          }
        }
        const aggIdx = n * (1 * 3) + l * 3 + d;
        AggData[aggIdx] = sum;
      }
    }
  }
  const Agg = createTensor('Agg', ['n', 'l', 'd'], [4, 1, 3], AggData);

  steps.push({
    name: 'Aggregation: Agg[n, l, d] = Neig(n, n′) Z[n′, l, d]',
    explanation: `Aggregate features from neighbors.

Tensor Logic (from paper):
  Agg[n, l, d] = Neig(n, n′) Z[n′, l, d]

For each node n, sum the transformed embeddings Z of all its neighbors n′.
The relation Neig(n, n′) acts as a selector - only nodes with
Neig[n, n′] = 1 contribute.

Example for Node 1 (Bob):
- Neighbors: Alice (0), Charlie (2), Diana (3)
- Agg[1] = Z[0] + Z[2] + Z[3]

This aggregates information from all connected nodes.`,
    tensor: Agg,
    tensorString: tensorToString(Agg, 2),
  });

  // Update: Emb[n, l+1, d] = relu(WAgg Agg[n, l, d] + WSelf Emb[n, l, d])
  // For simplicity, we'll use identity weights
  const WAgg = createTensor('WAgg', ['d'], [3], new Float64Array([1, 1, 1]));
  const WSelf = createTensor('WSelf', ['d'], [3], new Float64Array([0.5, 0.5, 0.5]));
  
  // Compute updated embeddings: element-wise multiply with broadcasting
  // AggWeighted[n, l, d] = Agg[n, l, d] * WAgg[d]
  const AggWeighted = broadcastMultiply(Agg, WAgg, 2);
  AggWeighted.name = 'AggWeighted';
  
  // SelfWeighted[n, l, d] = Emb[n, l, d] * WSelf[d]
  const SelfWeighted = broadcastMultiply(Emb, WSelf, 2);
  SelfWeighted.name = 'SelfWeighted';
  
  const UpdatedFeatures = relu(add(AggWeighted, SelfWeighted));
  UpdatedFeatures.name = 'UpdatedFeatures';
  UpdatedFeatures.indices = ['n', 'l', 'd'];

  steps.push({
    name: 'Update: Emb[n, l+1, d] = relu(WAgg Agg[n, l, d] + WSelf Emb[n, l, d])',
    explanation: `Update embeddings by combining aggregated and self information.

Tensor Logic (from paper):
  Emb[n, l+1, d] = relu(WAgg Agg[n, l, d] + WSelf Emb[n, l, d])

This combines:
- Aggregated neighbor information (WAgg Agg)
- Self information (WSelf Emb)

The residual connection (WSelf Emb) helps with gradient flow
and allows nodes to retain their own features while incorporating
neighbor information.

This completes one layer of message passing. Multiple layers can
be stacked to increase the receptive field.`,
    tensor: UpdatedFeatures,
    tensorString: tensorToString(UpdatedFeatures, 2),
  });

  // Node classification: Y[n] = sig(WOut[d] Emb[n, L, d])
  // Extract final layer embeddings
  // UpdatedFeatures has shape [n, l, d] = [4, 1, 3] representing Emb[n, 1, d] (layer 1)
  // In this single-layer example: layer 0 = initial, layer 1 = final (after one update)
  // So L = 1, and we extract layer 1: EmbFinal[n, d] = UpdatedFeatures[n, 1, d]
  // Extract slice at l=0 (which represents layer 1 in this single-layer example)
  const EmbFinal = extractSlice(UpdatedFeatures, 1, 0);
  EmbFinal.name = 'EmbFinal';
  
  steps.push({
    name: 'Final Layer Embeddings: Emb[n, L, d]',
    explanation: `Extract final layer embeddings for classification.

Tensor Logic (from paper):
  EmbFinal[n, d] = UpdatedFeatures[n, L, d]  // where L is the final layer

For this single-layer example:
- Layer 0: Initial embeddings Emb[n, 0, d] = X[n, d]
- Layer 1: Final embeddings Emb[n, 1, d] (after one update)

So L = 1. UpdatedFeatures has shape [4, 1, 3] representing Emb[n, 1, d].
We extract these to get EmbFinal[n, d] for classification.`,
    tensor: EmbFinal,
    tensorString: tensorToString(EmbFinal, 2),
  });
  
  const WOut = createTensor('WOut', ['d'], [3], new Float64Array([0.3, 0.5, 0.2]));
  const PreOutput = einsum('nd,d->n', EmbFinal, WOut);
  PreOutput.name = 'PreOutput';
  
  steps.push({
    name: 'Pre-activation: WOut[d] Emb[n, L, d]',
    explanation: `Compute weighted sum of embeddings.

Tensor Logic (from paper):
  PreOutput[n] = WOut[d] Emb[n, L, d]

Einstein sum "nd,d->n" contracts over dimension d, producing
a scalar score for each node n.`,
    tensor: PreOutput,
    tensorString: tensorToString(PreOutput, 3),
  });
  
  const Y = sigmoid(PreOutput);
  Y.name = 'Y';

  steps.push({
    name: 'Node Classification: Y[n] = sig(WOut[d] Emb[n, L, d])',
    explanation: `Classify nodes using final layer embeddings.

Tensor Logic (from paper):
  Y[n] = sig(WOut[d] Emb[n, L, d])

This computes a classification score for each node by:
1. Weighted sum of final layer embeddings (WOut[d] Emb[n, L, d])
2. Apply sigmoid activation (sig) to get probability

The sigmoid function sig() maps the output to [0, 1] for binary classification.`,
    tensor: Y,
    tensorString: tensorToString(Y, 3),
  });

  return {
    title: 'Graph Neural Networks in Tensor Logic',
    description: `This example demonstrates Graph Neural Networks using the notation from the paper.

From Table 1 in the paper, a GNN layer performs:
1. Initialization: Emb[n, 0, d] = X[n, d]
2. MLP: Z[n, l, d′] = relu(WP[l, d′, d] Emb[n, l, d])
3. Aggregation: Agg[n, l, d] = Neig(n, n′) Z[n′, l, d]
4. Update: Emb[n, l+1, d] = relu(WAgg Agg[n, l, d] + WSelf Emb[n, l, d])
5. Node classification: Y[n] = sig(WOut[d] Emb[n, L, d])

Where:
- Neig(x, y) is a relation (Boolean tensor) defining the graph structure
- Emb[n, l, d] contains the d-dimensional embedding of each node n in each layer l
- The network carries out L iterations of message passing, one per layer
- WP, WAgg, WSelf, and WOut are learnable weight tensors
- relu is the rectified linear unit activation function
- sig is the sigmoid function

This is exactly Einstein summation! The relation Neig(n, n′) acts as a
"selector" - it determines which nodes contribute to each node's
updated representation, just like a logical relation determines
which facts contribute to a derived fact.`,
    code: `// Graph Neural Network (from paper Table 1):
Neig(x, y)  // Graph structure
Emb[n, 0, d] = X[n, d]  // Initialization
Z[n, l, d′] = relu(WP[l, d′, d] Emb[n, l, d])  // MLP
Agg[n, l, d] = Neig(n, n′) Z[n′, l, d]  // Aggregation
Emb[n, l+1, d] = relu(WAgg Agg[n, l, d] + WSelf Emb[n, l, d])  // Update
Y[n] = sig(WOut[d] Emb[n, L, d])  // Node classification`,
    steps,
  };
}

