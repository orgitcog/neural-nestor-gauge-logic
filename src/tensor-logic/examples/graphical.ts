/**
 * PROBABILISTIC GRAPHICAL MODELS IN TENSOR LOGIC
 * 
 * Graphical models (Bayesian networks, Markov random fields) represent
 * joint probability distributions using graph structure to encode
 * conditional independence.
 * 
 * THE KEY INSIGHT:
 * A joint probability distribution can be factored as a product of
 * factors (potentials), and inference is summing out variables.
 * This is exactly Einstein summation!
 * 
 * P(A,B,C) = ψ_AB(A,B) · ψ_BC(B,C) / Z
 * P(A) = Σ_B,C P(A,B,C)  ← marginalization is just summing out indices
 * 
 * FOR THE MATHEMATICIAN:
 * Graphical models exploit the structure of probability distributions:
 * 
 * Bayesian Networks: Directed acyclic graphs where
 *   P(X_1,...,X_n) = Π_i P(X_i | Parents(X_i))
 * 
 * Markov Random Fields: Undirected graphs where
 *   P(X) = (1/Z) Π_C ψ_C(X_C) for cliques C
 * 
 * Inference operations:
 * - Marginalization: Σ_B P(A,B) - sum out unwanted variables (einsum!)
 * - Conditioning: P(A|B=b) = P(A,B=b)/P(B=b) - slice and normalize
 * - MAP inference: argmax_X P(X) - find most likely configuration
 * 
 * The connection to logic:
 * - Boolean factors (0/1) give logical constraints
 * - This is essentially satisfiability checking
 * - "Markov Logic" explicitly combines logic with probability
 */

import {
  Tensor,
  createTensor,
  einsum,
  scale,
  tensorToString,
} from '../core';

export interface GraphicalModelResult {
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
 * Example: Simple Bayesian Network
 * 
 * Classic "Student" network:
 *   Difficulty → Grade ← Intelligence
 *                  ↓
 *               Letter
 * 
 * Variables:
 *   D (Difficulty): easy(0), hard(1)
 *   I (Intelligence): low(0), high(1)
 *   G (Grade): A(0), B(1), C(2)
 *   L (Letter): weak(0), strong(1)
 * 
 * Joint: P(D,I,G,L) = P(D)·P(I)·P(G|D,I)·P(L|G)
 */
export function runGraphicalModelExample(): GraphicalModelResult {
  const steps: GraphicalModelResult['steps'] = [];

  // P(D) - Prior on difficulty
  const P_D = createTensor(
    'P(D)',
    ['d'],
    [2],
    new Float64Array([0.6, 0.4]) // 60% easy, 40% hard
  );

  steps.push({
    name: 'P(Difficulty)',
    explanation: `Prior probability of course difficulty.

P(D):
  P(easy) = 0.6
  P(hard) = 0.4

This is a root node - no parents in the Bayesian network.`,
    tensor: P_D,
    tensorString: tensorToString(P_D, 2),
  });

  // P(I) - Prior on intelligence
  const P_I = createTensor(
    'P(I)',
    ['i'],
    [2],
    new Float64Array([0.7, 0.3]) // 70% average, 30% high
  );

  steps.push({
    name: 'P(Intelligence)',
    explanation: `Prior probability of student intelligence.

P(I):
  P(low) = 0.7
  P(high) = 0.3

Also a root node - independent of Difficulty.`,
    tensor: P_I,
    tensorString: tensorToString(P_I, 2),
  });

  // P(G|D,I) - Grade depends on both difficulty and intelligence
  // Shape: [D, I, G] = [2, 2, 3]
  const P_G_given_DI = createTensor(
    'P(G|D,I)',
    ['d', 'i', 'g'],
    [2, 2, 3],
    new Float64Array([
      // D=easy, I=low: likely B
      0.3, 0.4, 0.3, // P(A), P(B), P(C)
      // D=easy, I=high: likely A
      0.9, 0.08, 0.02,
      // D=hard, I=low: likely C
      0.05, 0.25, 0.7,
      // D=hard, I=high: more varied
      0.5, 0.3, 0.2,
    ])
  );

  steps.push({
    name: 'P(Grade | Difficulty, Intelligence)',
    explanation: `Conditional probability of grade given difficulty and intelligence.

P(G|D,I)[d,i,g] - each slice [d,i,:] sums to 1.

Key patterns:
- Easy course + high intelligence → mostly A (0.9)
- Hard course + low intelligence → mostly C (0.7)
- Hard course + high intelligence → mixed, favoring A (0.5)

This encodes domain knowledge about how grades depend on
difficulty and intelligence.`,
    tensor: P_G_given_DI,
    tensorString: tensorToString(P_G_given_DI, 2),
  });

  // P(L|G) - Letter depends on grade
  // Shape: [G, L] = [3, 2]
  const P_L_given_G = createTensor(
    'P(L|G)',
    ['g', 'l'],
    [3, 2],
    new Float64Array([
      // G=A: strong letter likely
      0.1, 0.9,
      // G=B: weak letter slightly more likely
      0.6, 0.4,
      // G=C: weak letter very likely
      0.99, 0.01,
    ])
  );

  steps.push({
    name: 'P(Letter | Grade)',
    explanation: `Conditional probability of recommendation letter strength.

P(L|G)[g,l]:
  A → mostly strong (0.9)
  B → slightly weak (0.6 weak, 0.4 strong)
  C → almost always weak (0.99)

Professors write strong letters for A students!`,
    tensor: P_L_given_G,
    tensorString: tensorToString(P_L_given_G, 2),
  });

  // Compute joint distribution: P(D,I,G,L) = P(D)·P(I)·P(G|D,I)·P(L|G)
  // Step 1: P(D)·P(I) → P(D,I) via outer product (no shared indices)
  const P_DI = einsum('d,i->di', P_D, P_I);
  P_DI.name = 'P(D,I)';

  steps.push({
    name: 'P(D,I) = P(D)·P(I)',
    explanation: `Joint of independent variables is just outer product.

Tensor Logic: P_DI[d,i] = P_D[d] · P_I[i]
Einstein sum: "d,i->di" (no contraction, just broadcast)

Since D and I are independent:
  P(D,I) = P(D)·P(I)

The result is a 2×2 table of joint probabilities.`,
    tensor: P_DI,
    tensorString: tensorToString(P_DI, 3),
  });

  // Step 2: P(D,I)·P(G|D,I) → P(D,I,G)
  const P_DIG = einsum('di,dig->dig', P_DI, P_G_given_DI);
  P_DIG.name = 'P(D,I,G)';

  steps.push({
    name: 'P(D,I,G) = P(D,I)·P(G|D,I)',
    explanation: `Incorporate grade by multiplying conditional.

Tensor Logic: P_DIG[d,i,g] = P_DI[d,i] · P_G_given_DI[d,i,g]
Einstein sum: "di,dig->dig" (element-wise along d,i; broadcast g)

This is the chain rule of probability!`,
    tensor: P_DIG,
    tensorString: tensorToString(P_DIG, 3),
  });

  // Step 3: P(D,I,G)·P(L|G) → P(D,I,G,L)
  const P_DIGL = einsum('dig,gl->digl', P_DIG, P_L_given_G);
  P_DIGL.name = 'P(D,I,G,L)';

  steps.push({
    name: 'P(D,I,G,L) = P(D,I,G)·P(L|G)',
    explanation: `Full joint distribution over all variables.

Tensor Logic: P_DIGL[d,i,g,l] = P_DIG[d,i,g] · P_L_given_G[g,l]
Einstein sum: "dig,gl->digl"

This is a 2×2×3×2 = 24-entry tensor representing the
complete joint probability distribution.

Total probability: Σ P(D,I,G,L) = 1`,
    tensor: P_DIGL,
    tensorString: tensorToString(P_DIGL, 4),
  });

  // INFERENCE: Compute P(L) by marginalization
  // P(L) = Σ_{D,I,G} P(D,I,G,L)
  const P_L = einsum('digl->l', P_DIGL);
  P_L.name = 'P(L)';

  steps.push({
    name: 'P(Letter) via Marginalization',
    explanation: `Marginal probability of letter strength.

Tensor Logic: P_L[l] = P_DIGL[d,i,g,l]
Einstein sum: "digl->l" (sum out d,i,g)

P(weak letter) = ${P_L.data[0].toFixed(3)}
P(strong letter) = ${P_L.data[1].toFixed(3)}

This sums over all possible values of D, I, G.
Marginalization = summing out variables = projection in einsum!`,
    tensor: P_L,
    tensorString: tensorToString(P_L, 3),
  });

  // INFERENCE: Compute P(I|L=strong) via Bayes' rule
  // P(I|L=strong) = P(I,L=strong) / P(L=strong)
  // First, get P(I,L) by marginalizing out D,G
  const P_IL = einsum('digl->il', P_DIGL);
  P_IL.name = 'P(I,L)';

  steps.push({
    name: 'P(Intelligence, Letter)',
    explanation: `Joint of I and L, marginalizing out D and G.

Tensor Logic: P_IL[i,l] = P_DIGL[d,i,g,l]
Einstein sum: "digl->il"

This gives us P(I,L) which we'll use for conditioning.`,
    tensor: P_IL,
    tensorString: tensorToString(P_IL, 3),
  });

  // P(I|L=strong) = P(I,L=strong) / P(L=strong)
  const P_L_strong = P_L.data[1];
  const P_I_given_L_strong = createTensor(
    'P(I|L=strong)',
    ['i'],
    [2],
    new Float64Array([
      P_IL.data[1] / P_L_strong, // P(low|strong)
      P_IL.data[3] / P_L_strong, // P(high|strong)
    ])
  );

  steps.push({
    name: 'P(Intelligence | Letter=strong)',
    explanation: `Posterior probability of intelligence given strong letter.

Bayes' Rule: P(I|L=strong) = P(I,L=strong) / P(L=strong)

Prior P(I):
  P(low) = 0.70, P(high) = 0.30

Posterior P(I|L=strong):
  P(low|strong) = ${P_I_given_L_strong.data[0].toFixed(3)}
  P(high|strong) = ${P_I_given_L_strong.data[1].toFixed(3)}

Observing a strong letter shifts our belief toward high intelligence!
This is Bayesian inference - updating beliefs with evidence.`,
    tensor: P_I_given_L_strong,
    tensorString: tensorToString(P_I_given_L_strong, 3),
  });

  return {
    title: 'Bayesian Network in Tensor Logic',
    description: `Graphical models represent joint distributions via factorization.

From the paper, a Bayesian network can be encoded in tensor logic using
one equation per variable:

  PX[x] = CPTX[x, par1, ..., parn] P1[par1] ... Pn[parn]

where CPTX[x, par1, ..., parn] is the conditional probability table for
variable X given its parents, and P1[par1] ... Pn[parn] are the parent distributions.

The core operations map directly to Tensor Logic:
1. Factor product: P(A,B) = P(A)·P(B|A) is element-wise multiplication
2. Marginalization: P(A) = Σ_B P(A,B) is summing out indices (einsum)
3. Conditioning: P(A|B=b) is slicing then normalizing

The connection to logic is profound:
- Boolean factors (0/1) give logical constraints
- Marginalization becomes existential quantification (∃)
- Factor product becomes conjunction (∧)
- This is exactly Markov Logic!

Tensor Logic unifies:
- Symbolic AI (Boolean tensors → SAT solving, theorem proving)
- Probabilistic AI (Real tensors → graphical model inference)
- Neural AI (Learned tensors → deep learning)`,
    code: `// Bayesian Network (from paper):
PX[x] = CPTX[x, par1, ..., parn] P1[par1] ... Pn[parn]

// Joint probability distribution:
P(A,B,C) = ψ_AB(A,B) · ψ_BC(B,C) / Z

// Marginalization (sum out variables):
P(A) = Σ_B,C P(A,B,C)`,
    steps,
  };
}

/**
 * Example: Hidden Markov Model
 * 
 * HMMs model sequences with hidden states. The classic example is
 * part-of-speech tagging: hidden states are POS tags, observations are words.
 * 
 * Structure:
 *   S_0 → S_1 → S_2 → ...  (hidden states, Markov chain)
 *    ↓     ↓     ↓
 *   O_0   O_1   O_2       (observations)
 */
export function runHMMExample(): GraphicalModelResult {
  const steps: GraphicalModelResult['steps'] = [];

  // Simple HMM: 2 hidden states (rainy/sunny), 2 observations (umbrella/no umbrella)
  // State: 0=sunny, 1=rainy
  // Observation: 0=no umbrella, 1=umbrella

  // Initial state distribution
  const Pi = createTensor('π', ['s0'], [2], new Float64Array([0.6, 0.4]));

  steps.push({
    name: 'Initial State Distribution π',
    explanation: `Prior probability of initial hidden state.

π[s0]:
  P(sunny) = 0.6
  P(rainy) = 0.4`,
    tensor: Pi,
    tensorString: tensorToString(Pi, 2),
  });

  // Transition matrix: P(S_t | S_{t-1})
  const A = createTensor(
    'A',
    ['s_prev', 's_curr'],
    [2, 2],
    new Float64Array([
      0.7, 0.3, // sunny → sunny(0.7), rainy(0.3)
      0.4, 0.6, // rainy → sunny(0.4), rainy(0.6)
    ])
  );

  steps.push({
    name: 'Transition Matrix A',
    explanation: `State transition probabilities.

A[s_prev, s_curr]:
  sunny → sunny: 0.7, rainy: 0.3
  rainy → sunny: 0.4, rainy: 0.6

Weather tends to persist (diagonal > 0.5).`,
    tensor: A,
    tensorString: tensorToString(A, 2),
  });

  // Emission matrix: P(O_t | S_t)
  const B = createTensor(
    'B',
    ['s', 'o'],
    [2, 2],
    new Float64Array([
      0.9, 0.1, // sunny → no umbrella(0.9), umbrella(0.1)
      0.2, 0.8, // rainy → no umbrella(0.2), umbrella(0.8)
    ])
  );

  steps.push({
    name: 'Emission Matrix B',
    explanation: `Observation probabilities given hidden state.

B[s, o]:
  sunny → no umbrella: 0.9, umbrella: 0.1
  rainy → no umbrella: 0.2, umbrella: 0.8

People usually carry umbrellas when it rains!`,
    tensor: B,
    tensorString: tensorToString(B, 2),
  });

  // Observation sequence: [umbrella, umbrella, no umbrella]
  // We want: P(hidden states | observations)

  // Forward algorithm: compute P(S_t, O_1:t)
  // α[s] = P(S=s, observations so far)

  // Time 0: observe umbrella (o=1)
  // α_0[s0] = π[s0] · B[s0, o=1]
  const alpha0 = createTensor(
    'α₀',
    ['s'],
    [2],
    new Float64Array([
      Pi.data[0] * B.data[1], // sunny & umbrella
      Pi.data[1] * B.data[3], // rainy & umbrella
    ])
  );

  steps.push({
    name: 'Forward α₀ (after observing umbrella)',
    explanation: `Forward variable at time 0.

α₀[s] = π[s] · B[s, umbrella]

Tensor Logic: α₀[s] = π[s] · B[s,o=1]

  α₀[sunny] = 0.6 × 0.1 = 0.06
  α₀[rainy] = 0.4 × 0.8 = 0.32

Observing an umbrella makes "rainy" more likely.`,
    tensor: alpha0,
    tensorString: tensorToString(alpha0, 3),
  });

  // Time 1: observe umbrella again
  // α_1[s1] = Σ_{s0} α_0[s0] · A[s0,s1] · B[s1, o=1]
  // First: Σ_{s0} α_0[s0] · A[s0,s1]
  const alpha1_pre = einsum('s,st->t', alpha0, A);

  // Then multiply by emission
  const alpha1 = createTensor(
    'α₁',
    ['s'],
    [2],
    new Float64Array([
      alpha1_pre.data[0] * B.data[1], // sunny & umbrella
      alpha1_pre.data[1] * B.data[3], // rainy & umbrella
    ])
  );

  steps.push({
    name: 'Forward α₁ (after 2nd umbrella)',
    explanation: `Forward variable at time 1.

α₁[s1] = (Σ_{s0} α₀[s0] · A[s0,s1]) · B[s1, umbrella]

Tensor Logic:
  temp[s1] = α₀[s0] · A[s0,s1]  // einsum "s,st->t"
  α₁[s1] = temp[s1] · B[s1,o=1]

The einsum contracts (sums out) the previous state s0,
propagating probability forward through the Markov chain.

Two umbrellas in a row → even more confident it's rainy.`,
    tensor: alpha1,
    tensorString: tensorToString(alpha1, 4),
  });

  // Time 2: observe NO umbrella
  const alpha2_pre = einsum('s,st->t', alpha1, A);
  const alpha2 = createTensor(
    'α₂',
    ['s'],
    [2],
    new Float64Array([
      alpha2_pre.data[0] * B.data[0], // sunny & no umbrella
      alpha2_pre.data[1] * B.data[2], // rainy & no umbrella
    ])
  );

  steps.push({
    name: 'Forward α₂ (after no umbrella)',
    explanation: `Forward variable at time 2.

α₂[s2] = (Σ_{s1} α₁[s1] · A[s1,s2]) · B[s2, no_umbrella]

No umbrella observed → shifts belief back toward sunny.`,
    tensor: alpha2,
    tensorString: tensorToString(alpha2, 4),
  });

  // Normalize to get P(S_2 | observations)
  const Z = alpha2.data[0] + alpha2.data[1];
  const P_S2_given_obs = scale(alpha2, 1 / Z);
  P_S2_given_obs.name = 'P(S₂|obs)';

  steps.push({
    name: 'Posterior P(S₂ | observations)',
    explanation: `Normalized posterior over final state.

P(S₂|obs) = α₂ / Σα₂

Given sequence [umbrella, umbrella, no umbrella]:
  P(sunny) = ${P_S2_given_obs.data[0].toFixed(3)}
  P(rainy) = ${P_S2_given_obs.data[1].toFixed(3)}

The model infers the weather from umbrella observations!`,
    tensor: P_S2_given_obs,
    tensorString: tensorToString(P_S2_given_obs, 3),
  });

  return {
    title: 'Hidden Markov Model',
    description: `HMMs model sequences with hidden states.

The Forward algorithm computes P(S_t, O_1:t):
  α_t[s_t] = (Σ_{s_{t-1}} α_{t-1}[s_{t-1}] · A[s_{t-1},s_t]) · B[s_t,o_t]

This is pure Tensor Logic!
  - Transition: einsum "s,st->t" (matrix-vector product)
  - Emission: element-wise multiplication

The same pattern appears in:
- Speech recognition (states=phonemes, obs=acoustics)
- NLP tagging (states=POS tags, obs=words)
- Bioinformatics (states=genes, obs=nucleotides)

Transformers can be seen as a generalization where the
"transition" is learned attention over all previous states.`,
    code: `// HMM Forward Algorithm in Tensor Logic
// Initialize: α₀[s] = π[s] · B[s,o₀]
α₀[s] = π[s] · B[s,o₀]

// Recurse: α_t = (α_{t-1} · A) ⊙ B[:,o_t]
temp[s'] = Σ_s α[s] · A[s,s']
α'[s'] = temp[s'] · B[s',o]

// Normalize for posterior:
P(S_t|obs) = α_t / Σ_s α_t[s]`,
    steps,
  };
}

