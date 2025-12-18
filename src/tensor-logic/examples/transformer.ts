/**
 * TRANSFORMER ARCHITECTURE IN TENSOR LOGIC
 * 
 * The Transformer (Vaswani et al., 2017 - "Attention Is All You Need") is
 * the architecture behind GPT, BERT, and modern large language models.
 * 
 * THE KEY INSIGHT:
 * The Transformer's attention mechanism is just Einstein summation!
 * 
 * Self-attention computes:
 *   Attention[q,k] = softmax(Query[q,d] · Key[k,d] / √d)
 *   Output[q,d'] = Attention[q,k] · Value[k,d']
 * 
 * This is:
 * 1. First einsum "qd,kd->qk": For each query position q, compute similarity
 *    to all key positions k by summing over embedding dimension d
 * 2. Softmax normalizes to get attention weights (a probability distribution)
 * 3. Second einsum "qk,kd->qd": Weighted sum of values, contracting over k
 * 
 * FOR THE MATHEMATICIAN:
 * Attention can be understood as a soft dictionary lookup:
 * - Query: "What am I looking for?"
 * - Key: "What do I contain?"
 * - Value: "What information do I have?"
 * 
 * The dot product Query·Key measures relevance. Softmax creates a convex
 * combination. The output is a weighted sum of Values based on relevance.
 * 
 * This is analogous to logical unification: the query "unifies" with keys,
 * and the result combines the associated values. But instead of Boolean
 * matching, we have soft similarity matching.
 * 
 * The multi-head aspect projects Q, K, V through different learned matrices,
 * allowing the model to attend to different aspects simultaneously (like
 * having multiple logical rules that can fire in parallel).
 */

import {
  Tensor,
  createTensor,
  einsum,
  softmax,
  add,
  scale,
  tensorToString,
  relu,
} from '../core';

export interface TransformerResult {
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
 * Example: Self-Attention on a simple sequence
 * 
 * We'll process a sequence of 3 tokens, each with embedding dimension 4.
 * This demonstrates how attention allows each position to "look at" other
 * positions and gather relevant information.
 * 
 * Intuition: In the sentence "The cat sat on the mat", when processing "sat",
 * attention allows the model to focus on "cat" (the subject) more than "the".
 */
export function runTransformerExample(): TransformerResult {
  const steps: TransformerResult['steps'] = [];

  // Input sequence: 3 tokens, each with 4-dimensional embedding
  // These could represent words like ["The", "cat", "sat"]
  const Input = createTensor(
    'Input',
    ['seq', 'emb'],
    [3, 4],
    new Float64Array([
      // Token 0: "The" - a function word, lower magnitude
      0.2, 0.1, 0.3, 0.1,
      // Token 1: "cat" - a content word, distinctive pattern
      0.9, 0.2, 0.1, 0.8,
      // Token 2: "sat" - a verb, different pattern
      0.3, 0.7, 0.6, 0.2,
    ])
  );

  steps.push({
    name: 'Input Embeddings',
    explanation: `Input sequence with 3 tokens, each embedded in 4 dimensions.

Input[seq, emb] - the raw token embeddings:
  Token 0 ("The"): [0.2, 0.1, 0.3, 0.1]
  Token 1 ("cat"): [0.9, 0.2, 0.1, 0.8]
  Token 2 ("sat"): [0.3, 0.7, 0.6, 0.2]

Each token starts with its own embedding. Attention will allow
tokens to incorporate information from other positions.`,
    tensor: Input,
    tensorString: tensorToString(Input, 2),
  });

  // In a real Transformer, we'd have learned projection matrices.
  // For simplicity, we'll use identity-like projections.
  
  // Query projection: What is this token looking for?
  const Wq = createTensor(
    'Wq',
    ['emb', 'head'],
    [4, 4],
    new Float64Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ])
  );

  // Key projection: What does this token offer to match?
  const Wk = createTensor(
    'Wk',
    ['emb', 'head'],
    [4, 4],
    new Float64Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ])
  );

  // Value projection: What information does this token carry?
  const Wv = createTensor(
    'Wv',
    ['emb', 'head'],
    [4, 4],
    new Float64Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ])
  );

  // Compute Q, K, V by projecting the input
  // Q[q,d] = Input[q,e] · Wq[e,d]
  const Query = einsum('qe,ed->qd', Input, Wq);
  Query.name = 'Query';

  steps.push({
    name: 'Query Vectors',
    explanation: `Query projection: Q[q,d] = Input[q,e] · Wq[e,d]

The Query represents "what is this position looking for?"
Einstein sum "qe,ed->qd" projects each token's embedding.

In natural language, verbs might query for their subjects,
pronouns might query for their antecedents, etc.`,
    tensor: Query,
    tensorString: tensorToString(Query, 2),
  });

  const Key = einsum('ke,ed->kd', Input, Wk);
  Key.name = 'Key';

  steps.push({
    name: 'Key Vectors',
    explanation: `Key projection: K[k,d] = Input[k,e] · Wk[e,d]

The Key represents "what does this position offer?"
Other positions will match their queries against these keys.

Content words (nouns, verbs) typically have distinctive keys
that make them easy to attend to when relevant.`,
    tensor: Key,
    tensorString: tensorToString(Key, 2),
  });

  const Value = einsum('ve,ed->vd', Input, Wv);
  Value.name = 'Value';

  steps.push({
    name: 'Value Vectors',
    explanation: `Value projection: V[v,d] = Input[v,e] · Wv[e,d]

The Value represents "what information to pass on."
After computing attention weights, we'll take a weighted
combination of these values.`,
    tensor: Value,
    tensorString: tensorToString(Value, 2),
  });

  // Compute attention scores: QK^T / √d
  // Scores[q,k] = Σ_d Query[q,d] · Key[k,d]
  // Note: This is a dot product between each query and each key
  const attentionScores = einsum('qd,kd->qk', Query, Key);
  attentionScores.name = 'AttentionScores';

  steps.push({
    name: 'Attention Scores (QK^T)',
    explanation: `Attention scores: Scores[q,k] = Query[q,d] · Key[k,d]

Einstein sum "qd,kd->qk" computes dot product over d dimension.
This measures how much each query position should attend to
each key position.

Scores[q,k] is high when token q's query matches token k's key.

This is analogous to logical unification: we're finding which
"facts" (keys) match our "query pattern" (queries).`,
    tensor: attentionScores,
    tensorString: tensorToString(attentionScores, 2),
  });

  // Scale by √d for numerical stability
  const d = 4;
  const scaledScores = scale(attentionScores, 1 / Math.sqrt(d));
  scaledScores.name = 'ScaledScores';

  steps.push({
    name: 'Scaled Scores (/√d)',
    explanation: `Scale scores by 1/√d for numerical stability.

ScaledScores[q,k] = Scores[q,k] / √4 = Scores[q,k] / 2

Without scaling, large embedding dimensions cause dot products
to grow large, making softmax saturate (approach 0 or 1),
which kills gradients during training.`,
    tensor: scaledScores,
    tensorString: tensorToString(scaledScores, 2),
  });

  // Apply softmax to get attention weights
  // Each row sums to 1 (probability distribution over keys for each query)
  const attentionWeights = softmax(scaledScores, 1);
  attentionWeights.name = 'AttentionWeights';

  steps.push({
    name: 'Attention Weights (Softmax)',
    explanation: `Softmax normalizes each row to a probability distribution.

AttentionWeights[q,k] = exp(ScaledScores[q,k]) / Σ_k' exp(ScaledScores[q,k'])

Each row sums to 1. The weights tell us how much each query
position attends to each key position.

For example, row 2 (token "sat") might attend strongly to
row 1 (token "cat") to find its subject.

This is the "soft" version of logical matching - instead of
Boolean yes/no, we get a probability distribution.`,
    tensor: attentionWeights,
    tensorString: tensorToString(attentionWeights, 3),
  });

  // Compute output: weighted sum of values
  // Output[q,d] = Σ_k AttentionWeights[q,k] · Value[k,d]
  const AttentionOutput = einsum('qk,kd->qd', attentionWeights, Value);
  AttentionOutput.name = 'AttentionOutput';

  steps.push({
    name: 'Attention Output',
    explanation: `Final attention output: Out[q,d] = AttentionWeights[q,k] · Value[k,d]

Einstein sum "qk,kd->qd" contracts over the key dimension k.
Each output position is a weighted sum of all value vectors,
where weights come from attention.

This is analogous to the logical inference step: after finding
matching facts, we combine their information.

The output at each position now contains information from
other positions, weighted by relevance (attention).`,
    tensor: AttentionOutput,
    tensorString: tensorToString(AttentionOutput, 2),
  });

  // In a full Transformer, we'd also have:
  // 1. Residual connection: Output = Input + AttentionOutput
  // 2. Layer normalization
  // 3. Feed-forward network: FFN(x) = ReLU(x·W1)·W2
  
  // Let's add the feed-forward network (simplified)
  const W_ff1 = createTensor(
    'W_ff1',
    ['emb', 'hidden'],
    [4, 8],
    new Float64Array(32).map(() => (Math.random() - 0.5) * 0.5)
  );
  const W_ff2 = createTensor(
    'W_ff2',
    ['hidden', 'emb'],
    [8, 4],
    new Float64Array(32).map(() => (Math.random() - 0.5) * 0.5)
  );

  // FFN: ReLU(x·W1)·W2
  const ffHidden = relu(einsum('qe,eh->qh', AttentionOutput, W_ff1));
  const ffOutput = einsum('qh,he->qe', ffHidden, W_ff2);
  ffOutput.name = 'FFNOutput';

  steps.push({
    name: 'Feed-Forward Network Output',
    explanation: `Feed-forward network applied position-wise.

FFN[q,d] = ReLU(AttentionOut[q,e] · W1[e,h]) · W2[h,d]

This is a 2-layer MLP applied independently to each position.
The hidden dimension (8) is typically larger than embedding (4).

The FFN allows the model to compute more complex functions
of the attention output - think of it as "processing" the
information gathered by attention.

Tensor Logic notation:
  Hidden[q,h] = ReLU(Input[q,e] · W1[e,h])
  Output[q,d] = Hidden[q,h] · W2[h,d]`,
    tensor: ffOutput,
    tensorString: tensorToString(ffOutput, 2),
  });

  // Residual connection
  const residualOutput = add(Input, ffOutput);
  residualOutput.name = 'ResidualOutput';

  steps.push({
    name: 'After Residual Connection',
    explanation: `Residual connection adds input back to output.

Output[q,d] = Input[q,d] + FFNOutput[q,d]

Residual connections help with gradient flow during training
and allow the network to learn "refinements" to the input
rather than complete transformations.

This completes one Transformer layer. A full model stacks
many such layers (GPT-3 has 96, GPT-4 likely more).`,
    tensor: residualOutput,
    tensorString: tensorToString(residualOutput, 2),
  });

  return {
    title: 'Transformers in Tensor Logic',
    description: `The Transformer architecture, basis of modern LLMs (GPT, BERT, etc.).

From Table 2 in the paper, the Transformer components are:

Input: X(p, t) - relation stating that position p contains token t
Embedding: EmbX[p, d] = X(p, t) Emb[t, d]
Residual stream: Stream[0, p, d] = EmbX[p, d] + PosEnc[p, d]
Attention: Query[b, h, p, dk] = WQ[b, h, dk, d] Stream[b, p, d]
          Comp[b, h, p, p′] = softmax(Query[b, h, p, dk] Key[b, h, p′, dk]/sqrt(Dk))
          Attn[b, h, p, dv] = Comp[b, h, p, p′] Val[b, h, p′, dv]
Merge: Merge[b, p, dm] = concat(Attn[b, h, p, dv])
Output: Y[p, t] = softmax(WO[t, d] Stream[B, p, d])

Where:
- b is the attention block index
- h is the attention head index
- p is the position index
- d, dk, dv, dm are dimension indices

The key insight: Attention is Einstein summation! This is analogous to
logical inference but with soft matching (dot product + softmax) instead
of Boolean unification, enabling gradient-based learning.`,
    code: `// Transformer (from paper Table 2):
X(p, t)  // Input relation
EmbX[p, d] = X(p, t) Emb[t, d]  // Embedding
Stream[0, p, d] = EmbX[p, d] + PosEnc[p, d]  // Residual stream
Query[b, h, p, dk] = WQ[b, h, dk, d] Stream[b, p, d]  // Attention
Comp[b, h, p, p′] = softmax(Query[b, h, p, dk] Key[b, h, p′, dk]/sqrt(Dk))
Attn[b, h, p, dv] = Comp[b, h, p, p′] Val[b, h, p′, dv]
Y[p, t] = softmax(WO[t, d] Stream[B, p, d])  // Output`,
    steps,
  };
}

/**
 * Multi-Head Attention
 * 
 * Instead of single attention, we run multiple attention "heads" in parallel,
 * each with its own Q, K, V projections. This allows attending to different
 * aspects simultaneously (e.g., one head for syntax, one for semantics).
 */
export function runMultiHeadAttentionExample(): TransformerResult {
  const steps: TransformerResult['steps'] = [];

  // Simplified 2-head attention on 2 tokens with embedding dim 4
  // Each head has dimension 2 (total 4 = 2 heads × 2 dim)
  const Input = createTensor(
    'Input',
    ['seq', 'emb'],
    [2, 4],
    new Float64Array([
      0.5, 0.3, 0.8, 0.2, // Token 0
      0.2, 0.9, 0.1, 0.7, // Token 1
    ])
  );

  steps.push({
    name: 'Input (2 tokens, 4 dims)',
    explanation: `Input sequence for multi-head attention.

2 tokens with 4-dimensional embeddings.
We'll use 2 attention heads, each with dimension 2.

Multi-head attention allows the model to attend to different
"aspects" of the input simultaneously.`,
    tensor: Input,
    tensorString: tensorToString(Input, 2),
  });

  // Split embedding into 2 heads
  // Head 0 uses dimensions [0,1], Head 1 uses dimensions [2,3]
  const Head0_Input = createTensor(
    'Head0',
    ['seq', 'head_dim'],
    [2, 2],
    new Float64Array([
      Input.data[0], Input.data[1],
      Input.data[4], Input.data[5],
    ])
  );

  const Head1_Input = createTensor(
    'Head1',
    ['seq', 'head_dim'],
    [2, 2],
    new Float64Array([
      Input.data[2], Input.data[3],
      Input.data[6], Input.data[7],
    ])
  );

  steps.push({
    name: 'Head 0 Input',
    explanation: `First attention head operates on first 2 dimensions.

Head0 might learn to attend to syntactic features.`,
    tensor: Head0_Input,
    tensorString: tensorToString(Head0_Input, 2),
  });

  steps.push({
    name: 'Head 1 Input',
    explanation: `Second attention head operates on last 2 dimensions.

Head1 might learn to attend to semantic features.

By running multiple heads in parallel, the model can learn
different attention patterns for different purposes.`,
    tensor: Head1_Input,
    tensorString: tensorToString(Head1_Input, 2),
  });

  // Compute attention for each head
  const scores0 = einsum('qd,kd->qk', Head0_Input, Head0_Input);
  const weights0 = softmax(scale(scores0, 1 / Math.sqrt(2)), 1);
  const out0 = einsum('qk,kd->qd', weights0, Head0_Input);

  const scores1 = einsum('qd,kd->qk', Head1_Input, Head1_Input);
  const weights1 = softmax(scale(scores1, 1 / Math.sqrt(2)), 1);
  const out1 = einsum('qk,kd->qd', weights1, Head1_Input);

  steps.push({
    name: 'Head 0 Attention Weights',
    explanation: `Attention pattern for head 0.

Each head learns its own attention pattern based on
different aspects of the input.`,
    tensor: weights0,
    tensorString: tensorToString(weights0, 3),
  });

  steps.push({
    name: 'Head 1 Attention Weights',
    explanation: `Attention pattern for head 1.

Notice the attention patterns can be quite different
between heads - this is the power of multi-head attention.`,
    tensor: weights1,
    tensorString: tensorToString(weights1, 3),
  });

  // Concatenate head outputs
  const MultiHeadOutput = createTensor(
    'MultiHeadOutput',
    ['seq', 'emb'],
    [2, 4],
    new Float64Array([
      out0.data[0], out0.data[1], out1.data[0], out1.data[1],
      out0.data[2], out0.data[3], out1.data[2], out1.data[3],
    ])
  );

  steps.push({
    name: 'Concatenated Multi-Head Output',
    explanation: `Outputs from all heads concatenated together.

MultiHeadOutput[seq,emb] = concat(Head0_Out, Head1_Out)

In practice, this is followed by another linear projection
to mix the head outputs:
  FinalOutput = MultiHeadOutput · W_O

This allows information from different heads to interact.`,
    tensor: MultiHeadOutput,
    tensorString: tensorToString(MultiHeadOutput, 2),
  });

  return {
    title: 'Multi-Head Attention',
    description: `Multi-head attention runs multiple attention mechanisms in parallel.

Each head can learn to attend to different aspects:
- Head 0 might focus on local syntactic relationships
- Head 1 might focus on semantic similarity
- Head 2 might focus on positional relationships
- etc.

The outputs are concatenated and projected:
  MultiHead(Q,K,V) = concat(head_1, ..., head_h) · W^O

Where each head_i = Attention(Q·W_i^Q, K·W_i^K, V·W_i^V)

In Tensor Logic, multi-head is just running the same einsum pattern
with different weight tensors, then concatenating along the embedding axis.`,
    code: `// Multi-Head Attention:
// For each head: head_i = Attention(Q·W_i^Q, K·W_i^K, V·W_i^V)
// Concatenate and project:
MultiHead(Q,K,V) = concat(head_1, ..., head_h) · W^O`,
    steps,
  };
}

