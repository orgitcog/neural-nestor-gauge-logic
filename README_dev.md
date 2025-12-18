# Development Guide

<!-- TOC -->

- [Getting Started](#getting-started)
  - [Have a Look Around in the Documents](#have-a-look-around-in-the-documents)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Build](#build)
  - [Type Checking & Linting](#type-checking-linting)
  - [Scripts](#scripts)
- [Project Structure](#project-structure)
  - [Frontend (TypeScript/Vite)](#frontend-typescript-vite)
  - [Backend (Rust/Shuttle)](#backend-rust-shuttle)
  - [Examples](#examples)
- [Build Configuration](#build-configuration)
  - [Vite Configuration (`vite.config.ts`)](#vite-configuration-viteconfigts)
  - [TypeScript Configuration](#typescript-configuration)
- [Fonts](#fonts)
- [Deployment](#deployment)
  - [Shuttle.dev Deployment](#shuttledev-deployment)
  - [Build Timestamp](#build-timestamp)
- [Additional Resources](#additional-resources)

<!-- /TOC -->
This document contains development setup instructions and project structure information for the Tensor Logic educational demo.

## Getting Started

### Have a Look Around in the Documents

Before diving into development, take a moment to explore the comprehensive documentation available in the [`docs/`](./docs/) folder. The [`docs/README.md`](./docs/README.md) file provides a complete guide to all documentation, research materials, and development notes, including:

- The original Tensor Logic research paper
- Development prompts and project history
- Performance optimization analysis
- CI/CD setup guides
- Security audit documentation
- And much more

This documentation index will help you understand the project's theoretical foundation, development process, and available resources.

### Prerequisites

- **Node.js 18+** (see [`docs/Versions.md`](./docs/Versions.md) for specific version)
- **npm** (see [`docs/Versions.md`](./docs/Versions.md) for specific version)
- **Rust** (for backend deployment to Shuttle.dev - optional for local development)

### Installation

```bash
npm install
```

### Development

Start the Vite development server:

```bash
npm run dev
```

The app will automatically open at http://localhost:3000. The dev server includes:
- Hot module replacement (HMR)
- Build timestamp set to current time in PST/PDT
- Source maps for debugging

### Build

Build the production bundle:

```bash
npm run build
```

This will:
1. Type-check the TypeScript code (`tsc`)
2. Build the Vite bundle
3. Output to `backend/tensor-logic/dist/` (for Shuttle deployment)
4. Generate a build timestamp in PST/PDT format (YYYY-MM-DD_HH:MM)

The build timestamp is embedded as `__BUILD_TIME__` and displayed in the app footer.

### Type Checking & Linting

```bash
# Type-check main application
npm run typecheck

# Lint main application
npm run lint

# Type-check scripts (stricter config)
npm run typecheck:scripts
```

### Scripts

The project includes TypeScript utility scripts in `scripts/`:

- **`generate-toc.ts`**: Generates table of contents for markdown files
- **`check-dns-propagation.ts`**: Checks DNS propagation for custom domains
- **`verify-domain-setup.ts`**: Verifies custom domain configuration

To build scripts:

```bash
npm run build:scripts
```

To type-check scripts (uses stricter TypeScript config):

```bash
npm run typecheck:scripts
```

Scripts use a separate TypeScript configuration (`tsconfig.scripts.json`) with stricter settings for better code quality.

## Project Structure

### Frontend (TypeScript/Vite)

```
tensor-logic/
├── src/
│   ├── index.html          # Main HTML entry point
│   ├── main.ts             # Application entry point & UI logic
│   ├── styles.css          # Global styles
│   ├── fonts.css           # Font face declarations
│   ├── fonts/              # Self-hosted Google Fonts (woff2)
│   │   ├── crimson-pro/    # Serif font (body text)
│   │   ├── jetbrains-mono/ # Monospace font (code)
│   │   └── outfit/         # Sans-serif font (headings)
│   └── tensor-logic/
│       ├── core.ts         # Core tensor operations & einsum
│       ├── index.ts        # Public API exports
│       └── examples/
│           ├── index.ts    # Example exports
│           ├── logic.ts    # Logic programming (Ancestor/Parent)
│           ├── mlp.ts      # MLP (XOR) + MLP Batch Processing
│           ├── transformer.ts # Transformer & Multi-Head Attention
│           ├── kernel.ts   # Kernel machines (SVM)
│           └── graphical.ts # Bayesian Networks & HMMs
├── package.json
├── tsconfig.json           # Main TypeScript config
├── tsconfig.scripts.json   # Scripts TypeScript config (strict)
└── vite.config.ts          # Vite configuration
```

### Backend (Rust/Shuttle)

```
backend/tensor-logic/
├── src/
│   └── main.rs             # Axum server (serves static files)
├── Cargo.toml              # Rust dependencies
├── Shuttle.toml            # Shuttle deployment config
└── dist/                   # Built frontend (from npm run build)
    ├── index.html
    └── assets/             # JS, CSS, fonts
```

The backend is a simple Rust/Axum server that:
- Serves static files from `dist/`
- Provides SPA fallback (all routes serve `index.html`)
- Handles asset serving from `/assets/`
- Designed for deployment on Shuttle.dev

**Note**: For local development, you only need the frontend. The backend is only required for deployment.

### Examples

The demo includes **8 interactive examples**:

1. **Logic Programming** (`logic.ts`) - Symbolic AI: Ancestor/Parent rules
2. **Multi-Layer Perceptron** (`mlp.ts`) - Neural Networks: XOR problem
3. **MLP Batch Processing** (`mlp.ts`) - Neural Networks: Batch XOR processing
4. **Transformer Self-Attention** (`transformer.ts`) - Neural Networks: Attention mechanism
5. **Multi-Head Attention** (`transformer.ts`) - Neural Networks: Parallel attention heads
6. **Kernel Machines/SVM** (`kernel.ts`) - Hybrid: RBF kernel classification
7. **Bayesian Networks** (`graphical.ts`) - Probabilistic: Student network inference
8. **Hidden Markov Models** (`graphical.ts`) - Probabilistic: Forward algorithm

Each example demonstrates how Tensor Logic unifies different AI paradigms through Einstein summation.

## Build Configuration

### Vite Configuration (`vite.config.ts`)

- **Root**: `src/` (Vite serves from this directory)
- **Build Output**: `../backend/tensor-logic/dist/` (for Shuttle deployment)
- **Dev Server**: Port 3000, auto-opens browser
- **Build Timestamp**: Generated in PST/PDT timezone, embedded as `__BUILD_TIME__`

### TypeScript Configuration

- **`tsconfig.json`**: Main app config (ES2022, strict mode)
- **`tsconfig.scripts.json`**: Scripts config (stricter, includes unused variable checks)

## Fonts

The project uses **self-hosted Google Fonts** for privacy and performance:

- **Crimson Pro** (serif) - Body text
- **JetBrains Mono** (monospace) - Code blocks
- **Outfit** (sans-serif) - Headings

Fonts are stored in `src/fonts/` as `.woff2` files and loaded via `src/fonts.css`.

See [`src/fonts/README.md`](./src/fonts/README.md) for download instructions if fonts need to be updated.

## Deployment

### Shuttle.dev Deployment

The project is configured for deployment on [Shuttle.dev](https://shuttle.rs):

1. **Build frontend**: `npm run build` (outputs to `backend/tensor-logic/dist/`)
2. **Deploy backend**: `cd backend/tensor-logic && cargo shuttle deploy`

The Rust backend serves the static frontend files. See [`docs/CI_CD.md`](./docs/CI_CD.md) for:
- GitHub Actions CI/CD setup
- Automated deployment workflows
- Custom domain configuration
- DNS setup procedures

### Build Timestamp

The build timestamp is displayed in the app footer and shows when the app was built (in PST/PDT). It's set:
- **Dev mode**: When the Vite dev server starts
- **Production**: During `npm run build`

The timestamp format is `YYYY-MM-DD_HH:MM` (PST/PDT timezone).

## Additional Resources

- **Main README**: [`README.md`](./README.md) - Project overview and user-facing documentation
- **Documentation Index**: [`docs/README.md`](./docs/README.md) - Complete documentation guide
- **CI/CD Guide**: [`docs/CI_CD.md`](./docs/CI_CD.md) - Deployment and automation setup
- **Security Audit**: [`docs/SECURITY_AUDIT.md`](./docs/SECURITY_AUDIT.md) - Security best practices
- **Performance Options**: [`docs/Performance-Options.md`](./docs/Performance-Options.md) - Performance optimization analysis
- **Development Environment**: [`docs/Versions.md`](./docs/Versions.md) - Tool versions and setup

