# Documentation

<!-- TOC -->

- [Quick Navigation](#quick-navigation)
- [Files](#files)
  - [Performance-Options.md](#performance-optionsmd)
  - [prompts.md](#promptsmd)
  - [Versions.md](#versionsmd)
  - [2510.12269v3.pdf](#251012269v3pdf)
- [Related Documentation](#related-documentation)

<!-- /TOC -->
This directory contains documentation, research materials, and development notes for the Tensor Logic educational demo project.

## Quick Navigation

- **Want to optimize performance?** → Start with [Performance-Options.md](./Performance-Options.md)
- **Understanding the project origin?** → See [prompts.md](./prompts.md)
- **Need the theoretical foundation?** → Read [2510.12269v3.pdf](./2510.12269v3.pdf)
- **Setting up development environment?** → Check [Versions.md](./Versions.md)

---

## Files

### Performance-Options.md

**Comprehensive performance optimization analysis** (42KB, ~1,123 lines)

See: [`Performance-Options.md`](./Performance-Options.md)

A detailed evaluation of options to improve performance for dense tensor operations in the Tensor Logic educational demo. This document includes:

- **Initial Request**: Analysis of performance concerns with the current TypeScript implementation
- **Quick Reference Summary**: Decision matrix and top recommendations
- **Detailed Analysis**: Feasibility evaluation of 5+ optimization options:
  - PyTorch/TensorFlow backend (Option 1)
  - CUDA or Mojo backend (Option 2)
  - Mathematica implementation (Option 3)
  - Mojo direct implementation (Option 4)
  - WebGPU with TensorFlow.js (Additional Option)
- **WebGPU with TensorFlow.js - How It Works**: Complete implementation guide including:
  - Client-side GPU architecture explanation
  - Hardware performance comparisons (M1 iMac, NVIDIA GPUs, 2018 MacBook Pro)
  - Integration examples and code snippets
  - Browser support and limitations
  - Shuttle.dev deployment guidance

**Key Recommendation**: TensorFlow.js with WebGPU backend for client-side GPU acceleration without requiring a backend server.

---

### prompts.md

**Development prompts and feature summary** (2.4KB, 57 lines)

See: [`prompts.md`](./prompts.md)

Documents the original prompts used to generate the Tensor Logic educational web application. Includes:

- The consolidated prompt that created the initial implementation
- Summary of generated features:
  - Core Tensor Logic Engine
  - 7 Interactive Examples (Logic, MLP, Transformer, Multi-Head Attention, Bayesian Networks, HMM, Kernel Machines)
  - Educational UI design
  - Tech stack details

Useful for understanding the project's origin and design decisions.

---

### Versions.md

**Development environment report** (650B, 30 lines)

See: [`Versions.md`](./Versions.md)

A preflight report documenting the development environment at project creation:

- Cursor IDE version and configuration
- Account and subscription details
- Local CLI tools (Node.js, npm versions)
- Cursor extensions enabled
- MCP servers configured

Useful for reproducing the development environment or troubleshooting setup issues.

---

### 2510.12269v3.pdf

**Tensor Logic: The Language of AI** (299KB, 2,407 lines)

See: [`2510.12269v3.pdf`](./2510.12269v3.pdf)

The original research paper by Prof. Emeritus Pedro Domingos (University of Washington) that forms the theoretical foundation of this project.

**Key Concepts:**
- Unification of neural and symbolic AI through tensor operations
- Einstein summation as the fundamental operation
- Logical rules as tensor contractions
- The relationship between Boolean logic and neural networks

**Reference:**
- arXiv: [2510.12269](https://arxiv.org/abs/2510.12269)
- Website: [tensor-logic.org](https://tensor-logic.org)

This paper is the primary source material for understanding Tensor Logic theory and implementation.

---

## Related Documentation

- Main project README: [`../README.md`](../README.md)
- Scripts documentation: [`../scripts/README.md`](../scripts/README.md)

