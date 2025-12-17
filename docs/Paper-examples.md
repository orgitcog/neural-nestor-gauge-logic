# Paper Examples: Tensor Logic Implementation

From: Domingos, P. (2025). *Tensor Logic: The Language of AI*. [arXiv:2510.12269](https://arxiv.org/abs/2510.12269)

<!-- TOC -->

- [Graph Neural Networks in Tensor Logic (Table 1)](#graph-neural-networks-in-tensor-logic-table-1)
  - [Notes](#notes)
- [Transformers in Tensor Logic (Table 2)](#transformers-in-tensor-logic-table-2)
  - [Notes](#notes)
- [Components of Graphical Models in Tensor Logic (Table 3)](#components-of-graphical-models-in-tensor-logic-table-3)
  - [Notes](#notes)
- [Bayesian Network Example](#bayesian-network-example)
- [Core Concepts](#core-concepts)
  - [What is a Relation?](#what-is-a-relation)
  - [The Type and Shape of a Tensor (Rank)](#the-type-and-shape-of-a-tensor-rank)
  - [The Einstein Sum (Einsum)](#the-einstein-sum-einsum)
  - [The Relation Between Tensors and Relations](#the-relation-between-tensors-and-relations)
  - [The Relation Between Datalog Rules and Einsums](#the-relation-between-datalog-rules-and-einsums)
  - [Projection of a Tensor onto a Subset of Indices](#projection-of-a-tensor-onto-a-subset-of-indices)
  - [What is a Tensor Equation?](#what-is-a-tensor-equation)
  - [Syntactic Sugar](#syntactic-sugar)
  - [Datalog Syntax - Denoting Boolean Types](#datalog-syntax-denoting-boolean-types)
  - [Sparse Boolean Examples](#sparse-boolean-examples)
- [Neural Networks](#neural-networks)
  - [Multilayer Perceptron (MLP)](#multilayer-perceptron-mlp)
  - [Basic Recursive Neural Network (RNN)](#basic-recursive-neural-network-rnn)
  - [Convolutional Neural Network (CNN)](#convolutional-neural-network-cnn)
- [Inference Algorithms](#inference-algorithms)
  - [Forward Chaining and Backward Chaining - When to Use Each](#forward-chaining-and-backward-chaining-when-to-use-each)
- [Learning](#learning)
  - [The Derivative of a Tensor Equation](#the-derivative-of-a-tensor-equation)
  - [Gradient of Tensor Logic Program - Also a Tensor Logic Program](#gradient-of-tensor-logic-program-also-a-tensor-logic-program)
  - [Loss Function](#loss-function)
- [Tensor Decomposition](#tensor-decomposition)
  - [Tensor Decomposition](#tensor-decomposition)
- [Kernel Machines](#kernel-machines)
  - [Kernel Machines - General](#kernel-machines-general)
  - [Polynomial Kernel](#polynomial-kernel)
  - [Gaussian Kernel (RBF)](#gaussian-kernel-rbf)
- [Symbolic AI](#symbolic-ai)
  - [Symbolic AI in Tensor Logic](#symbolic-ai-in-tensor-logic)
- [Reasoning in Embedding Space](#reasoning-in-embedding-space)
  - [Knowledge Representation and Reasoning in an Embedded Space - What is an Embedded Space?](#knowledge-representation-and-reasoning-in-an-embedded-space-what-is-an-embedded-space)
  - [The Sim Gram Matrix](#the-sim-gram-matrix)
  - [The Sigmoid Function](#the-sigmoid-function)
- [Marginalization of a Subset](#marginalization-of-a-subset)
  - [Marginalization of a Subset](#marginalization-of-a-subset)

<!-- /TOC -->

---

## Graph Neural Networks in Tensor Logic (Table 1)

| Component | Equation |
|-----------|----------|
| **Graph structure** | `Neig(x, y)` |
| **Initialization** | `Emb[n, 0, d] = X[n, d]` |
| **MLP** | `Z[n, l, d′] = relu(WP[l, d′, d] Emb[n, l, d]), etc.` |
| **Aggregation** | `Agg[n, l, d] = Neig(n, n′) Z[n′, l, d]` |
| **Update** | `Emb[n, l+1, d] = relu(WAgg Agg[n, l, d] + WSelf Emb[n, l, d])` |
| **Node classification** | `Y[n] = sig(WOut[d] Emb[n, L, d])` |
| **Edge prediction** | `Y[n, n′] = sig(Emb[n, L, d] Emb[n′, L, d])` |
| **Graph classification** | `Y = sig(WOut[d] Emb[n, L, d])` |

### Notes

- `Neig(x, y)` is a relation (or Boolean tensor) defining the graph structure, with one fact for each adjacent pair
- `Emb[n, l, d]` contains the d-dimensional embedding of each node n in each layer l
- Initialization sets each node's 0th-layer embeddings to its features `X[n, d]`
- The network carries out L iterations of message passing, one per layer
- `WP`, `WAgg`, `WSelf`, and `WOut` are learnable weight tensors
- `relu` is the rectified linear unit activation function
- `sig` is the sigmoid function

---

## Transformers in Tensor Logic (Table 2)

| Component | Equation(s) |
|-----------|-------------|
| **Input** | `X(p, t)` |
| **Embedding** | `EmbX[p, d] = X(p, t) Emb[t, d]` |
| **Pos. encoding** | `PosEnc[p, d] = Even(d) sin(p/Ld/De) + Odd(d) cos(p/Ld−1/De)` |
| **Residual stream** | `Stream[0, p, d] = EmbX[p, d] + PosEnc[p, d]` |
| **Attention** | `Query[b, h, p, dk] = WQ[b, h, dk, d] Stream[b, p, d], etc.`<br>`Comp[b, h, p, p′] = softmax(Query[b, h, p, dk] Key[b, h, p′, dk]/sqrt(Dk))`<br>`Attn[b, h, p, dv] = Comp[b, h, p, p′] Val[b, h, p′, dv]` |
| **Merge and layer norm** | `Merge[b, p, dm] = concat(Attn[b, h, p, dv])`<br>`Stream[b, p, d] = lnorm(WS[b, d, dm] Merge[b, p, dm] + Stream[b, p, d])` |
| **MLP** | `MLP[b, p] = relu(WP[p, d] Stream[b, p, d]), etc.` |
| **Output** | `Y[p, t] = softmax(WO[t, d] Stream[B, p, d])` |

### Notes

- `X(p, t)` is a relation stating that the pth position in the text contains the tth token
- `EmbX[p, d]` is the text's embedding matrix
- `PosEnc[p, d]` implements positional encoding as in the original Transformer paper (Vaswani et al., 2017)
- `Stream[b, p, d]` is the residual stream, initialized to the sum of embedding and positional encoding
- Attention uses indices `b` for the attention block and `h` for the attention head
- `Query`, `Key`, and `Val` are obtained by multiplying `Stream` by weight matrices `WQ`, `WK`, and `WV`
- `Comp[b, h, p, p′]` compares the query at each position with each key, scaled by `sqrt(Dk)`
- `Attn[b, h, p, dv]` is the attention output
- `Merge[b, p, dm]` concatenates the attention heads' outputs
- `lnorm` is layer normalization
- `MLP` layers are implemented with additional indices for block and position
- `Y[p, t]` is the output token probabilities

---

## Components of Graphical Models in Tensor Logic (Table 3)

| Component | Implementation in Tensor Logic |
|-----------|-------------------------------|
| **Factor** | `ϕ[x₁, x₂, ..., xₙ]` (tensor of non-negative real values) |
| **Marginalization** | `πα(T) = Σ_β T_αβ` (projection: sum over indices β not in α) |
| **Pointwise product** | `(U ⋊⋉ V)_αβγ = U_αβ V_βγ` (join on common indices β) |
| **Join tree** | Tree-like program (no tensor appears in more than one RHS) |
| **P(Query\|Evidence)** | `P(Q\|E) = Prog(Q,E)/Prog(E)` |
| **Belief propagation** | Forward chaining (iterative equation application until fixpoint) |
| **Sampling** | Backward chaining with selective projection (random subset of terms) |

### Notes

- A **factor** `ϕ[x₁, x₂, ..., xₙ]` is a tensor of non-negative real values, with one index per variable and one value of the index per value of the variable. The unnormalized probability of a state x is the product of the element in each tensor corresponding to x.

- **Marginalization** `πα(T) = Σ_β T_αβ` is tensor projection: summing out a subset of variables Y (indices β) in a factor, leaving a factor over the remaining variables X (indices α). If tensors are Boolean and projection is followed by a step function, tensor projection reduces to database projection.

- **Pointwise product** `(U ⋊⋉ V)_αβγ = U_αβ V_βγ` is the join of the corresponding tensors: combining two potentials over subsets of variables X (indices α) and Y (indices γ) into a single potential over X ∪ Y, where β are the common indices. If tensors are Boolean, tensor join reduces to database join.

- A **join tree** is a tree-like tensor logic program (one in which no tensor appears in more than one RHS), enabling linear-time inference. All marginal and conditional queries can be answered in time linear in the size of the tree by successively marginalizing factors and pointwise-multiplying them with the parent's factor.

- **P(Query\|Evidence)** `P(Q\|E) = Prog(Q,E)/Prog(E)` is computed as the ratio of two tensor logic programs, where `Prog(Q,E)` is the program with both query and evidence, and `Prog(E)` is the program with only evidence. The partition function Z can be computed by adding the equation `Z = T[...]` to the program, where `T[...]` is the LHS of the root factor's equation.

- **Belief propagation** (loopy belief propagation) is forward chaining on the tensor logic program representing the graphical model. In forward chaining, tensor equations are executed in turn, each one computing tensor elements for which necessary inputs are available; this is repeated until no new elements can be computed or a stopping criterion is satisfied.

- **Sampling** can be implemented by backward chaining with selective projection, i.e., replacing a projection by a random subset of its terms. In backward chaining, each tensor equation is treated as a function, with the query as the top-level call.

## Bayesian Network Example

A Bayesian network can be encoded in tensor logic using one equation per variable:
```
PX[x] = CPTX[x, par1, ..., parn] P1[par1] ... Pn[parn]
```
where `CPTX[x, par1, ..., parn]` is the conditional probability table for variable X given its parents, and `P1[par1] ... Pn[parn]` are the parent distributions.

---

## Core Concepts

### What is a Relation?

A **relation** is a statement of the form `r(o₁, ..., oₙ)`, where `r` is a relation name and the `o`'s are object names. For example:
- `Parent(Bob, Charlie)` states that Bob is a parent of Charlie
- `Ancestor(Alice, Bob)` states that Alice is an ancestor of Bob

In tensor logic, a relation is represented as a **Boolean tensor** (or sparse tensor), where each fact corresponds to a tensor element with value 1 (true) or 0 (false).

### The Type and Shape of a Tensor (Rank)

A tensor's **rank** (or order) is the number of indices it has. The **shape** is the size along each dimension.

**Examples:**
- A scalar (rank 0): no indices, e.g., `Z` (a single value)
- A vector (rank 1): one index, e.g., `Y[n]` where `n` ranges over nodes
- A matrix (rank 2): two indices, e.g., `Emb[n, d]` where `n` ranges over nodes and `d` over dimensions
- A 3D tensor (rank 3): three indices, e.g., `Emb[n, l, d]` where `n` ranges over nodes, `l` over layers, and `d` over dimensions

The shape of `Emb[n, l, d]` might be `(N, L, D)` where N is the number of nodes, L is the number of layers, and D is the embedding dimension.

### The Einstein Sum (Einsum)

**Einstein summation** (einsum) is the fundamental operation in tensor logic. It automatically sums over repeated indices.

**Example:**
```
Agg[n, l, d] = Neig(n, n′) Z[n′, l, d]
```

This equation:
1. Joins `Neig(n, n′)` and `Z[n′, l, d]` on the common index `n′`
2. Sums over `n′` (the repeated index)
3. Results in a tensor with indices `[n, l, d]`

The einsum notation `"nn',n'ld->nld"` explicitly shows: input indices `nn'` and `n'ld`, output indices `nld`, with `n'` being summed over.

### The Relation Between Tensors and Relations

A **relation** in logic programming corresponds to a **Boolean tensor** in tensor logic:
- A fact `Parent(Bob, Charlie)` becomes a tensor element `Parent[Bob, Charlie] = 1`
- The absence of a fact corresponds to `Parent[x, y] = 0`
- A relation `R(x, y)` is a 2D Boolean tensor `R[x, y]` where each `(x, y)` pair is either 1 (true) or 0 (false)

**Example:**
```
Ancestor(x, y) ← Parent(x, y)
```
becomes:
```
Ancestor[x, y] = Parent[x, y]
```

### The Relation Between Datalog Rules and Einsums

A Datalog rule is equivalent to a tensor equation using einsum:

**Datalog rule:**
```
Ancestor(x, z) ← Ancestor(x, y), Parent(y, z)
```

**Tensor Logic equation:**
```
Ancestor[x, z] = Ancestor[x, y] Parent[y, z]
```

This equation:
1. Joins `Ancestor[x, y]` and `Parent[y, z]` on the common index `y`
2. Sums over `y` (implicit in einsum)
3. Projects onto `[x, z]`

In database terminology, this is a join followed by a projection.

### Projection of a Tensor onto a Subset of Indices

**Projection** `πα(T)` sums over indices not in α:

```
πα(T) = Σ_β T_αβ
```

where β are the indices not in α.

**Example:**
Given `T[x, y, z]`, projecting onto `{x, z}`:
```
T_proj[x, z] = Σ_y T[x, y, z]
```

This sums out the `y` dimension, leaving a tensor over `x` and `z`.

### What is a Tensor Equation?

A **tensor equation** is the fundamental construct in tensor logic. It has the form:
```
LHS[indices] = RHS expression
```

**Example:**
```
Ancestor[x, z] = Ancestor[x, y] Parent[y, z]
```

- **LHS (Left-Hand Side):** `Ancestor[x, z]` - the tensor being computed
- **RHS (Right-Hand Side):** `Ancestor[x, y] Parent[y, z]` - the computation using einsum

A **tensor logic program** is a set of tensor equations.

### Syntactic Sugar

Tensor logic allows **syntactic sugar** to make programs more readable:

**Example - Multiple terms:**
```
Y[n] = sig(WOut[d] Emb[n, L, d])
```
can be written more explicitly as:
```
Y[n] = sig(Σ_d WOut[d] Emb[n, L, d])
```

The summation over `d` is implicit when `d` appears on the RHS but not the LHS.

### Datalog Syntax - Denoting Boolean Types

In Datalog, relations are Boolean (true/false). In tensor logic, Boolean tensors can be explicitly marked or inferred:

**Example:**
```
Neig(x, y)  // Boolean relation: 1 if nodes x and y are neighbors, 0 otherwise
```

When used in equations, Boolean tensors can be:
- Used directly: `Agg[n, l, d] = Neig(n, n′) Z[n′, l, d]`
- Converted to numeric: multiply by numeric tensors
- Thresholded: `step(T)` converts numeric to Boolean

### Sparse Boolean Examples

Sparse Boolean tensors represent relations efficiently:

**Example - Graph structure:**
```
Neig(x, y)  // Sparse: only stores pairs where Neig[x, y] = 1
```

For a graph with N nodes but only E edges (where E << N²), storing the full N×N matrix is wasteful. Instead, store only the E pairs where `Neig[x, y] = 1`.

**Example - Parent relation:**
```
Parent(x, y)  // Sparse: typically each person has 0-2 parents
```

---

## Neural Networks

### Multilayer Perceptron (MLP)

A multilayer perceptron in tensor logic:

```
Z[l, d′] = relu(WP[l, d′, d] X[l, d])
Y = sig(WOut[d] Z[L, d])
```

where:
- `X[l, d]` is the input at layer `l`
- `WP[l, d′, d]` are learnable weights mapping from dimension `d` to `d′` at layer `l`
- `Z[l, d′]` is the hidden representation
- `WOut[d]` are output weights
- `relu` is the rectified linear unit: `relu(x) = max(0, x)`
- `sig` is the sigmoid function

### Basic Recursive Neural Network (RNN)

A basic RNN processes sequences:

```
Hidden[t, d] = tanh(WH[d, d] Hidden[t-1, d] + WX[d, d_in] Input[t, d_in])
Output[t, d_out] = WO[d_out, d] Hidden[t, d]
```

where:
- `Hidden[t, d]` is the hidden state at time step `t`
- `Input[t, d_in]` is the input at time `t`
- `WH`, `WX`, `WO` are weight tensors
- `tanh` is the hyperbolic tangent activation

### Convolutional Neural Network (CNN)

A CNN applies convolutional filters:

```
Conv[l, c, h, w] = relu(WC[l, c, c_prev, f, f] Input[l, c_prev, h+f-1, w+f-1])
Pool[l, c, h, w] = max(Conv[l, c, 2h, 2w])
```

where:
- `WC[l, c, c_prev, f, f]` is a convolutional filter of size `f×f`
- The convolution operation uses einsum to slide the filter over the input
- `Pool` performs max pooling over 2×2 regions

---

## Inference Algorithms

### Forward Chaining and Backward Chaining - When to Use Each

**Forward Chaining:**
- **When to use:** When you want to compute all derivable facts (the deductive closure)
- **How it works:** Repeatedly apply rules to known facts until no new facts can be derived (fixpoint)
- **Example:** Computing all ancestors from parent facts:
  ```
  Ancestor[x, y] = Parent[x, y]  // Base case
  Ancestor[x, z] = Ancestor[x, y] Parent[y, z]  // Recursive case
  ```
  Forward chaining applies these equations iteratively until no new `Ancestor` facts are derived.

**Backward Chaining:**
- **When to use:** When you have a specific query and want to find if it's true
- **How it works:** Start with the query and work backwards, finding facts/rules that could prove it
- **Example:** Query `Ancestor(Alice, Charlie)?`
  - Check if `Ancestor[Alice, Charlie]` exists as a fact
  - If not, find rules with `Ancestor(x, z)` as head
  - Try to prove the body: `Ancestor(Alice, y)` and `Parent(y, Charlie)`
  - Recursively prove each subgoal

**In Graphical Models:**
- **Forward chaining** = Belief propagation (compute all marginals)
- **Backward chaining** = Sampling (generate specific samples)

---

## Learning

### The Derivative of a Tensor Equation

The derivative of a tensor equation with respect to its parameters uses automatic differentiation:

**Example:**
Given `Y[n] = sig(WOut[d] Emb[n, L, d])`, the derivative with respect to `WOut`:
```
∂Y/∂WOut[d] = Y[n] (1 - Y[n]) Emb[n, L, d]
```

This follows from the chain rule: derivative of sigmoid `sig(x) = 1/(1+e^(-x))` is `sig(x)(1-sig(x))`.

### Gradient of Tensor Logic Program - Also a Tensor Logic Program

The gradient computation itself can be expressed as a tensor logic program:

**Forward pass:**
```
Y[n] = sig(WOut[d] Emb[n, L, d])
Loss = Σ_n (Y[n] - Target[n])²
```

**Backward pass (gradient):**
```
∂Loss/∂WOut[d] = Σ_n 2(Y[n] - Target[n]) Y[n] (1 - Y[n]) Emb[n, L, d]
```

The gradient is computed using the same einsum operations, just with different equations.

### Loss Function

Common loss functions in tensor logic:

**Mean Squared Error:**
```
Loss = (1/N) Σ_n (Y[n] - Target[n])²
```

**Cross-Entropy (for classification):**
```
Loss = -Σ_n Σ_t Target[n, t] log(Y[n, t])
```

where `Y[n, t]` are class probabilities (from softmax) and `Target[n, t]` is the true label.

---

## Tensor Decomposition

### Tensor Decomposition

Tensor decomposition factorizes a large tensor into smaller ones:

**Tucker Decomposition:**
A tensor `T[i, j, k]` can be decomposed as:
```
T[i, j, k] ≈ Σ_a Σ_b Σ_c Core[a, b, c] U[i, a] V[j, b] W[k, c]
```

This is useful for:
- **Compression:** Representing sparse tensors efficiently
- **Scaling:** Converting sparse operations to dense ones on GPUs
- **Learning:** Finding low-rank approximations

Even a **random decomposition** can be sufficient for many applications, as mentioned in the paper for scaling up sparse tensor operations.

---

## Kernel Machines

### Kernel Machines - General

Kernel machines compute similarity between inputs using a kernel function:

**General form:**
```
Y = Σ_i α[i] K(X, X_i)
```

where:
- `K(X, X_i)` is the kernel function measuring similarity
- `α[i]` are learned weights
- `X_i` are support vectors

### Polynomial Kernel

The **polynomial kernel** of degree `d`:
```
K(x, x′) = (x · x′ + 1)^d
```

In tensor logic:
```
K[x, x′] = (Σ_i X[x, i] X[x′, i] + 1)^d
```

### Gaussian Kernel (RBF)

The **Gaussian** or **Radial Basis Function (RBF)** kernel:
```
K(x, x′) = exp(-γ ||x - x′||²)
```

In tensor logic:
```
K[x, x′] = exp(-γ Σ_i (X[x, i] - X[x′, i])²)
```

where `γ` is a hyperparameter controlling the kernel width.

---

## Symbolic AI

### Symbolic AI in Tensor Logic

Symbolic AI (logic programming) is naturally expressed in tensor logic:

**Example - Ancestor relation:**
```
// Facts (Boolean tensors)
Parent[Bob, Charlie] = 1
Parent[Alice, Bob] = 1

// Rules (tensor equations)
Ancestor[x, y] = Parent[x, y]  // Parents are ancestors
Ancestor[x, z] = Ancestor[x, y] Parent[y, z]  // Transitive closure
```

Forward chaining computes the full `Ancestor` relation. The result is a Boolean tensor where `Ancestor[x, y] = 1` if `x` is an ancestor of `y`.

---

## Reasoning in Embedding Space

### Knowledge Representation and Reasoning in an Embedded Space - What is an Embedded Space?

An **embedded space** (or embedding space) is a continuous vector space where objects are represented as dense vectors (embeddings) rather than discrete symbols.

**What is an embedding?**
- Each object `x` has a vector `Emb[x, d]` of dimension `d`
- Similar objects have similar embeddings (close in vector space)
- The embedding dimension `d` is typically much smaller than the number of objects

**Reasoning in embedding space:**
Instead of Boolean tensors, use numeric tensors and compute:
```
Ancestor[x, z] ≈ Ancestor[x, y] Parent[y, z]
```

where the product `Emb[x, d] Emb[y, d]` approximates the similarity/truth value.

### The Sim Gram Matrix

The **Gram matrix** `Sim[x, x′]` measures similarity between objects:

```
Sim[x, x′] = Emb[x, d] Emb[x′, d]
```

This is the dot product of embeddings. When embeddings are learned:
- `Sim[x, x′]` measures how similar objects `x` and `x′` are
- Similar objects "borrow" inferences from each other
- The weight is proportional to their similarity

**Example:**
If `Emb[Alice, d]` and `Emb[Bob, d]` are similar, and we know `Ancestor[Alice, Charlie]`, then `Ancestor[Bob, Charlie]` gets a high score even if not explicitly stored.

### The Sigmoid Function

The **sigmoid function** `σ(x)` maps real numbers to [0, 1]:

```
σ(x) = 1 / (1 + e^(-x))
```

**Temperature parameter:**
```
σ(x, T) = 1 / (1 + e^(-x/T))
```

- `T = 0`: Hard threshold (Boolean: 0 or 1)
- `T > 0`: Soft, continuous values
- Lower `T`: More "deductive" (strict)
- Higher `T`: More "analogical" (allows similarity-based reasoning)

**Usage:**
- Convert numeric tensor values to probabilities: `Y[n] = sig(WOut[d] Emb[n, L, d])`
- Control reasoning mode: `Ancestor_soft[x, y] = sig(Sim[x, y] / T)`
- At `T = 0`, reasoning is purely deductive (no hallucinations)
- At `T > 0`, reasoning becomes analogical, allowing generalization

---

## Marginalization of a Subset

### Marginalization of a Subset

**Marginalization** sums out variables not of interest:

**Example:**
Given a joint distribution `P(X, Y, Z)`, marginalize over `Y`:
```
P(X, Z) = Σ_y P(X, Y, Z)
```

In tensor notation:
```
P[x, z] = Σ_y P[x, y, z]
```

This is the same as projection: `πα(T)` where `α = {x, z}` and we sum over `β = {y}`.

**In graphical models:**
Marginalization computes marginal probabilities by summing out hidden variables, enabling inference over subsets of the full variable set.

