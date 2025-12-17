# Documentation

<!-- TOC -->

- [Quick Navigation](#quick-navigation)
- [Files](#files)
  - [2510.12269v3.pdf](#251012269v3pdf)
  - [prompts.md](#promptsmd)
  - [Performance-Options.md](#performance-optionsmd)
  - [CI_CD.md](#ci_cdmd)
  - [SECURITY_AUDIT.md](#security_auditmd)
  - [Versions.md](#versionsmd)
- [Related Documentation](#related-documentation)

<!-- /TOC -->
This directory contains documentation, research materials, and development notes for the Tensor Logic educational demo project.

## Quick Navigation

- **Need the theoretical foundation?** → Read [2510.12269v3.pdf](./2510.12269v3.pdf)
- **Understanding the project origin?** → See [prompts.md](./prompts.md)
- **Want to optimize performance?** → Start with [Performance-Options.md](./Performance-Options.md)
- **Setting up CI/CD or deploying?** → See [CI_CD.md](./CI_CD.md)
- **Security concerns?** → Review [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
- **Setting up development environment?** → Check [Versions.md](./Versions.md)

---

## Files

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

### prompts.md

**Development prompts and feature summary** (2.4KB, 57 lines)

See: [`prompts.md`](./prompts.md)

Documents the original prompts used to generate the Tensor Logic educational web application. Includes:

- The consolidated prompt that created the initial implementation
- Summary of generated features:
  - Core Tensor Logic Engine
  - 8 Interactive Examples (Logic, MLP, MLP Batch Processing, Transformer, Multi-Head Attention, Bayesian Networks, HMM, Kernel Machines)
  - Educational UI design
  - Tech stack details

Useful for understanding the project's origin and design decisions.

---

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

### CI_CD.md

**CI/CD Setup Guide** (1227 lines)

See: [`CI_CD.md`](./CI_CD.md)

Comprehensive guide for setting up continuous integration and deployment:

- **GitHub Actions CI Setup**: Step-by-step instructions for automated testing
- **Deployment to Shuttle**: Complete deployment workflow configuration
- **Custom Domain Configuration**: DNS setup, SSL certificates, domain verification
- **Project Scripts**: Documentation for utility scripts (TOC generator, DNS checker, domain verifier)
- **Troubleshooting**: Common issues and solutions

**Key Topics:**
- GitHub Actions workflow configuration
- Shuttle.dev deployment integration
- Custom domain setup with automated verification
- DNS propagation checking
- SSL certificate management

Essential reading for anyone setting up automated builds or deploying the application.

---

### SECURITY_AUDIT.md

**Security Audit and Best Practices** (1198 lines)

See: [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md)

Comprehensive security assessment and recommendations for the Tensor Logic educational demo:

- **Executive Summary**: Security profile and risk assessment
- **Current Security Posture**: Strengths and gaps
- **Security Recommendations**: Prioritized by urgency (Immediate, Short-Term, Medium-Term, Long-Term)
- **Static Frontend Security**: CSP, security headers, SRI, external resource management
- **CI/CD Security**: Dependency scanning, automated testing, secrets management
- **Repository Security**: Local and remote (GitHub) security measures
- **Deployment Security**: Shuttle configuration, HTTPS enforcement, monitoring
- **OWASP Top 10 Compliance**: Coverage of common vulnerabilities
- **Incident Response**: Procedures and checklists

**Key Focus Areas:**
- Content Security Policy (CSP) implementation
- Dependency vulnerability management
- Secrets handling in CI/CD
- HTTPS enforcement
- Security headers configuration

Essential reading for understanding security considerations and implementing best practices.

---

### Versions.md

**Development environment report** (650B, 30 lines)

See: [`Versions.md`](./Versions.md)

A preflight report documenting the development environment at project creation:

- Cursor IDE version and configuration (Pro plan, Claude Opus 4.5 model)
- Account and subscription details
- Local CLI tools (Node.js, npm versions)
- Cursor extensions enabled
- MCP servers configured

Useful for reproducing the development environment or troubleshooting setup issues.

---

## Related Documentation

- **Main project README**: [`../README.md`](../README.md) - User-facing project overview
- **Development Guide**: [`../README_dev.md`](../README_dev.md) - Developer setup and project structure
- **Fonts Documentation**: [`../src/fonts/README.md`](../src/fonts/README.md) - Self-hosted fonts setup

