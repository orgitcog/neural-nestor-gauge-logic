/**
 * LOGIC PROGRAMMING IN TENSOR LOGIC
 * 
 * This demonstrates how classical logic programming (like Datalog/Prolog) maps
 * directly to tensor operations through Einstein summation.
 * 
 * THE KEY INSIGHT:
 * A logical rule like:
 *    Ancestor(x,z) ← Parent(x,y), Ancestor(y,z)
 * 
 * Is mathematically equivalent to:
 *    Ancestor[x,z] = Σ_y Parent[x,y] · Ancestor[y,z]
 * 
 * This is because:
 * - In logic, the rule says "x is an ancestor of z if there exists some y
 *   such that x is the parent of y AND y is an ancestor of z"
 * - The comma (,) in logic is conjunction (AND)
 * - The existential "there exists y" is captured by the summation Σ_y
 * - In Boolean tensors, multiplication is AND, and summation followed by
 *   threshold (>0) gives us OR/EXISTS
 * 
 * FOR THE MATHEMATICIAN:
 * This is relational composition. If we view binary relations as matrices,
 * then Ancestor ← Parent · Ancestor is matrix multiplication, where the
 * intermediate index y is summed out. This is exactly the JOIN-PROJECT
 * pattern from relational algebra:
 *   1. JOIN Parent and Ancestor on their common variable y
 *   2. PROJECT onto the remaining variables (x, z)
 */

import {
  Tensor,
  fromMatrix,
  einsum,
  threshold,
  clone,
  tensorToString,
  add,
} from '../core';

export interface LogicProgramResult {
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
 * Example: Family relationships
 * 
 * Objects: Alice(0), Bob(1), Charlie(2), Diana(3)
 * 
 * Facts:
 *   Parent(Alice, Bob)    - Alice is Bob's parent
 *   Parent(Bob, Charlie)  - Bob is Charlie's parent
 *   Parent(Bob, Diana)    - Bob is Diana's parent
 * 
 * Rules:
 *   Ancestor(x,y) ← Parent(x,y)                    [Parents are ancestors]
 *   Ancestor(x,z) ← Ancestor(x,y), Parent(y,z)    [Transitive closure]
 * 
 * Query: Find all ancestor relationships
 */
export function runLogicProgramExample(): LogicProgramResult {
  const steps: LogicProgramResult['steps'] = [];

  // Define the Parent relation as a Boolean tensor
  // Parent[x,y] = 1 if x is a parent of y, 0 otherwise
  //
  // Matrix representation (rows = parent, cols = child):
  //          Alice  Bob  Charlie  Diana
  // Alice      0     1      0       0
  // Bob        0     0      1       1
  // Charlie    0     0      0       0
  // Diana      0     0      0       0
  const Parent = fromMatrix('Parent', ['x', 'y'], [
    [0, 1, 0, 0], // Alice is parent of Bob
    [0, 0, 1, 1], // Bob is parent of Charlie and Diana
    [0, 0, 0, 0], // Charlie has no children
    [0, 0, 0, 0], // Diana has no children
  ]);

  steps.push({
    name: 'Parent Relation',
    explanation: `The Parent relation encoded as a Boolean tensor.
Parent[x,y] = 1 means "x is the parent of y".

In Tensor Logic notation:
  Parent[Alice,Bob] = 1
  Parent[Bob,Charlie] = 1
  Parent[Bob,Diana] = 1`,
    tensor: Parent,
    tensorString: tensorToString(Parent, 0),
  });

  // Rule 1: Ancestor(x,y) ← Parent(x,y)
  // "Parents are ancestors"
  // This is just copying Parent to Ancestor
  let Ancestor = clone(Parent);
  Ancestor.name = 'Ancestor';

  steps.push({
    name: 'Rule 1: Ancestor ← Parent',
    explanation: `First rule: Every parent is an ancestor.

Tensor Logic:  Ancestor[x,y] = Parent[x,y]

This is a base case - direct copy of the Parent tensor.`,
    tensor: clone(Ancestor),
    tensorString: tensorToString(Ancestor, 0),
  });

  // Rule 2: Ancestor(x,z) ← Ancestor(x,y), Parent(y,z)
  // "If x is an ancestor of y, and y is parent of z, then x is ancestor of z"
  //
  // In tensor notation:
  //   Ancestor[x,z] += Σ_y Ancestor[x,y] · Parent[y,z]
  //
  // This is matrix multiplication! Einstein summation notation: "xy,yz->xz"
  // The shared index 'y' is summed over (the JOIN)
  // The result keeps indices x,z (the PROJECTION)

  // Iterate until fixpoint (no new ancestors found)
  let changed = true;
  let iteration = 0;

  while (changed && iteration < 10) {
    iteration++;

    // Compute new ancestors via the transitive rule
    // This einsum computes: NewAncestors[x,z] = Σ_y Ancestor[x,y] · Parent[y,z]
    const newAncestors = einsum('xy,yz->xz', Ancestor, Parent);

    // Apply threshold: any positive value becomes 1 (Boolean OR semantics)
    const thresholded = threshold(newAncestors);

    // Combine with existing ancestors (logical OR)
    const combined = add(Ancestor, thresholded);
    const combinedThresholded = threshold(combined);

    // Check if anything changed
    changed = false;
    for (let i = 0; i < Ancestor.data.length; i++) {
      if (combinedThresholded.data[i] !== Ancestor.data[i]) {
        changed = true;
        break;
      }
    }

    Ancestor = { ...combinedThresholded, name: 'Ancestor' };

    if (changed) {
      steps.push({
        name: `Rule 2 (iteration ${iteration})`,
        explanation: `Transitive rule: Ancestor[x,z] ← Ancestor[x,y], Parent[y,z]

Tensor Logic:  Ancestor[x,z] = threshold(Σ_y Ancestor[x,y] · Parent[y,z])

Einstein summation "xy,yz->xz" computes:
- For each pair (x,z), sum over all intermediate y
- Where both Ancestor[x,y]=1 AND Parent[y,z]=1
- This is JOIN on y, PROJECT onto (x,z)

New ancestors discovered in this iteration!`,
        tensor: clone(Ancestor),
        tensorString: tensorToString(Ancestor, 0),
      });
    }
  }

  steps.push({
    name: 'Final: Ancestor Relation (Fixpoint)',
    explanation: `Fixpoint reached after ${iteration} iteration(s).

Final Ancestor relation:
- Ancestor(Alice, Bob)     ✓  (direct parent)
- Ancestor(Alice, Charlie) ✓  (grandparent via Bob)
- Ancestor(Alice, Diana)   ✓  (grandparent via Bob)
- Ancestor(Bob, Charlie)   ✓  (direct parent)
- Ancestor(Bob, Diana)     ✓  (direct parent)

This is the DEDUCTIVE CLOSURE - all facts that can be derived from
the rules and base facts through logical inference.`,
    tensor: Ancestor,
    tensorString: tensorToString(Ancestor, 0),
  });

  return {
    title: 'Logic Programming: Family Relationships',
    description: `This example shows how Datalog-style logic programming maps to tensor operations.

From the paper, a Datalog rule is equivalent to a tensor equation using einsum:

Datalog rule:
  Ancestor(x, z) ← Ancestor(x, y), Parent(y, z)

Tensor Logic equation:
  Ancestor[x, z] = Ancestor[x, y] Parent[y, z]

This equation:
1. Joins Ancestor[x, y] and Parent[y, z] on the common index y
2. Sums over y (implicit in einsum)
3. Projects onto [x, z]

In database terminology, this is a join followed by a projection.

Where:
- The comma (AND) becomes multiplication
- The existential quantifier (∃y) becomes summation over y
- Boolean OR (multiple derivations) becomes threshold(sum)

This is the Einstein summation "xy,yz->xz" - the same operation that
underlies neural network layers, but operating on Boolean tensors.`,
    code: `// Datalog rule (from paper):
Ancestor(x, z) ← Ancestor(x, y), Parent(y, z)

// Equivalent Tensor Logic equation:
Ancestor[x, z] = Ancestor[x, y] Parent[y, z]

// This equation:
// 1. Joins Ancestor[x, y] and Parent[y, z] on the common index y
// 2. Sums over y (implicit in einsum)
// 3. Projects onto [x, z]`,
    steps,
  };
}

