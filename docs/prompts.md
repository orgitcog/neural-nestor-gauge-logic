# Tensor Logic Demo - Development Prompts

This document consolidates the prompts used to generate the Tensor Logic educational web application.

---

## First Shot

### Consolidated Prompt

> Create an interactive educational demo of Prof. Emeritus Pedro Domingos' Tensor Logic, based on his paper [Tensor Logic: The Language of AI](https://arxiv.org/pdf/2510.12269).
>
> The demo should feature many of the wide range of Machine Learning algorithms that Tensor Logic is capable of expressing, including the Transformer architecture.
>
> For each example, provide:
> 1. The Tensor Logic code
> 2. A brief explanation of the machine learning algorithm that a professional software engineer with a Masters in Computer Science and an undergraduate degree in Philosophy with a minor in Mathematics (specializing in symbolic and mathematical logic) would understand—but who is quite unfamiliar with Machine Learning or Artificial Intelligence.
>
> **Technical Requirements:**
> - Implementation in TypeScript that compiles without any errors, warnings, or lint issues
> - If a backend is needed, create it in Rust (also free of errors, warnings, or lint)
> - Include clickable links to the paper titled "Tensor Logic: The Language of AI" at https://arxiv.org/pdf/2510.12269
> - Attribute the work to Prof. Emeritus Pedro Domingos (University of Washington)
>
> **Source Material:** Upload `docs/2510.12269v3.pdf` (the Tensor Logic paper)

---

## Summary of Generated Features

The prompt above resulted in:

1. **Core Tensor Logic Engine** (`src/tensor-logic/core.ts`)
   - Einstein summation (einsum) implementation
   - Tensor operations: threshold, sigmoid, relu, softmax
   - Matrix operations: add, multiply, scale, transpose

2. **7 Interactive Examples**
   - **Symbolic AI:** Logic Programming (Ancestor/Parent relationships)
   - **Neural Networks:** Multi-Layer Perceptron (XOR problem)
   - **Neural Networks:** Transformer Self-Attention
   - **Neural Networks:** Multi-Head Attention
   - **Probabilistic:** Bayesian Networks (Student network)
   - **Probabilistic:** Hidden Markov Models (Weather/Umbrella)
   - **Hybrid:** Kernel Machines / SVM (RBF kernel classification)

3. **Educational UI**
   - Dark-themed scholarly aesthetic
   - Step-by-step execution visualization
   - Tensor output displays
   - Explanations for CS/Math/Philosophy background

4. **Tech Stack**
   - TypeScript + Vite
   - No external ML dependencies
   - Pure tensor operations from scratch
