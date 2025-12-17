# Paper Examples: Tensor Logic Implementation Tables

From: Domingos, P. (2025). *Tensor Logic: The Language of AI*. [arXiv:2510.12269](https://arxiv.org/abs/2510.12269)

<!-- TOC -->

- [Notes](#notes)
- [Notes](#notes)
- [Notes](#notes)
  - [Bayesian Network Example](#bayesian-network-example)

<!-- /TOC -->

---

# Graph Neural Networks in Tensor Logic (Table 1)

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

## Notes

- `Neig(x, y)` is a relation (or Boolean tensor) defining the graph structure, with one fact for each adjacent pair
- `Emb[n, l, d]` contains the d-dimensional embedding of each node n in each layer l
- Initialization sets each node's 0th-layer embeddings to its features `X[n, d]`
- The network carries out L iterations of message passing, one per layer
- `WP`, `WAgg`, `WSelf`, and `WOut` are learnable weight tensors
- `relu` is the rectified linear unit activation function
- `sig` is the sigmoid function

---

# Transformers in Tensor Logic (Table 2)

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

## Notes

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

# Components of Graphical Models in Tensor Logic (Table 3)

| Component | Implementation in Tensor Logic |
|-----------|-------------------------------|
| **Factor** | `ϕ[x₁, x₂, ..., xₙ]` (tensor of non-negative real values) |
| **Marginalization** | `πα(T) = Σ_β T_αβ` (projection: sum over indices β not in α) |
| **Pointwise product** | `(U ⋊⋉ V)_αβγ = U_αβ V_βγ` (join on common indices β) |
| **Join tree** | Tree-like program (no tensor appears in more than one RHS) |
| **P(Query\|Evidence)** | `P(Q\|E) = Prog(Q,E)/Prog(E)` |
| **Belief propagation** | Forward chaining (iterative equation application until fixpoint) |
| **Sampling** | Backward chaining with selective projection (random subset of terms) |

## Notes

- A **factor** `ϕ[x₁, x₂, ..., xₙ]` is a tensor of non-negative real values, with one index per variable and one value of the index per value of the variable. The unnormalized probability of a state x is the product of the element in each tensor corresponding to x.

- **Marginalization** `πα(T) = Σ_β T_αβ` is tensor projection: summing out a subset of variables Y (indices β) in a factor, leaving a factor over the remaining variables X (indices α). If tensors are Boolean and projection is followed by a step function, tensor projection reduces to database projection.

- **Pointwise product** `(U ⋊⋉ V)_αβγ = U_αβ V_βγ` is the join of the corresponding tensors: combining two potentials over subsets of variables X (indices α) and Y (indices γ) into a single potential over X ∪ Y, where β are the common indices. If tensors are Boolean, tensor join reduces to database join.

- A **join tree** is a tree-like tensor logic program (one in which no tensor appears in more than one RHS), enabling linear-time inference. All marginal and conditional queries can be answered in time linear in the size of the tree by successively marginalizing factors and pointwise-multiplying them with the parent's factor.

- **P(Query\|Evidence)** `P(Q\|E) = Prog(Q,E)/Prog(E)` is computed as the ratio of two tensor logic programs, where `Prog(Q,E)` is the program with both query and evidence, and `Prog(E)` is the program with only evidence. The partition function Z can be computed by adding the equation `Z = T[...]` to the program, where `T[...]` is the LHS of the root factor's equation.

- **Belief propagation** (loopy belief propagation) is forward chaining on the tensor logic program representing the graphical model. In forward chaining, tensor equations are executed in turn, each one computing tensor elements for which necessary inputs are available; this is repeated until no new elements can be computed or a stopping criterion is satisfied.

- **Sampling** can be implemented by backward chaining with selective projection, i.e., replacing a projection by a random subset of its terms. In backward chaining, each tensor equation is treated as a function, with the query as the top-level call.

### Bayesian Network Example

A Bayesian network can be encoded in tensor logic using one equation per variable:
```
PX[x] = CPTX[x, par1, ..., parn] P1[par1] ... Pn[parn]
```
where `CPTX[x, par1, ..., parn]` is the conditional probability table for variable X given its parents, and `P1[par1] ... Pn[parn]` are the parent distributions.

