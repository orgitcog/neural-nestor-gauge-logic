# Development Guide

<!-- TOC -->

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Build](#build)
  - [Type Checking & Linting](#type-checking-linting)
  - [Scripts](#scripts)
- [Project Structure](#project-structure)
- [Additional Resources](#additional-resources)

<!-- /TOC -->
This document contains development setup instructions and project structure information for the Tensor Logic educational demo.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

### Build

```bash
npm run build
```

### Type Checking & Linting

```bash
npm run typecheck
npm run lint
```

### Scripts

For TypeScript scripts (like the TOC generator):

```bash
npm run build:scripts
npm run typecheck:scripts
```

See [`scripts/README.md`](./scripts/README.md) for more information.

## Project Structure

```
tensor-logic/
├── src/
│   ├── index.html          # Main HTML entry point
│   ├── main.ts             # Application entry point & UI
│   ├── styles.css          # Styling
│   └── tensor-logic/
│       ├── core.ts         # Core tensor operations & einsum
│       └── examples/
│           ├── logic.ts      # Logic programming example
│           ├── mlp.ts        # Multi-layer perceptron
│           ├── transformer.ts # Transformer attention
│           ├── kernel.ts     # Kernel machines (SVM)
│           └── graphical.ts  # Bayesian networks & HMMs
├── docs/                   # Documentation and research materials
│   ├── README.md           # Documentation index
│   ├── Performance-Options.md  # Performance optimization analysis
│   ├── prompts.md          # Development prompts
│   ├── Versions.md         # Environment report
│   └── 2510.12269v3.pdf    # Tensor Logic paper
├── scripts/                # Development scripts
│   ├── generate-toc.ts     # TOC generator (TypeScript)
│   └── README.md           # Scripts documentation
├── package.json
├── tsconfig.json           # Main TypeScript config
├── tsconfig.scripts.json   # Scripts TypeScript config (strict)
└── vite.config.ts
```

## Additional Resources

- Main README: [`README.md`](./README.md)
- Documentation: [`docs/README.md`](./docs/README.md)
- Scripts: [`scripts/README.md`](./scripts/README.md)

