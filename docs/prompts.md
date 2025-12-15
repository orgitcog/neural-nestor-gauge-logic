# Tensor Logic Demo - Development Prompts

<!-- TOC -->

- [First Shot - with Opus 4.5 in Cursor](#first-shot-with-opus-45-in-cursor)
  - [Consolidated Prompt](#consolidated-prompt)
  - [Summary of Generated Features](#summary-of-generated-features)
- [Performance - with Auto mode in Cursor](#performance-with-auto-mode-in-cursor)
  - [Unified Performance Optimization Analysis Prompt](#unified-performance-optimization-analysis-prompt)
  - [Summary of Generated Analysis](#summary-of-generated-analysis)
- [CI/CD - with Auto mode in Cursor](#ci-cd-with-auto-mode-in-cursor)
  - [CI/CD Consolidated Prompt](#ci-cd-consolidated-prompt)
  - [CI/CD Summary of Generated Features](#ci-cd-summary-of-generated-features)
- [md review problems - with Auto mode in Cursor](#md-review-problems-with-auto-mode-in-cursor)
  - [md review problems Consolidated Prompt](#md-review-problems-consolidated-prompt)
  - [md review problems Summary of Generated Features](#md-review-problems-summary-of-generated-features)

<!-- /TOC -->
This document consolidates the prompts used to generate the Tensor Logic educational web application.

---

## First Shot - with Opus 4.5 in Cursor

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

### Summary of Generated Features

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

---

## Performance - with Auto mode in Cursor

### Unified Performance Optimization Analysis Prompt

> Even assuming that the ML examples in the Tensor Logic project are correct, they are likely to perform slowly without using GPU technology since it uses TypeScript and doesn't import any GPU libraries. (Please confirm.) This is expected to happen in cases where the tensor matrices used are very dense (not sparse). 
>
> Please evaluate the feasibility of the following options to achieve a practical performance boost:
>
> - **Option 1:** Write a preprocessor of Tensor Logic using PyTorch or TensorFlow. (Domingos suggested this in the MLST interview.)
> - **Option 2:** Decide if a backend in this app is possible and write just the backend in CUDA or Mojo.
> - **Option 3:** Implement Tensor Logic in Mathematica and use its native, elegant ML objects.
>   - Please review this chat in Perplexity.ai about the specific suggestion.
> - **Option 4:** Implement Tensor Logic in Mojo. This is probably more like Option 1.
>
> **Additional Considerations:**
> - The app is in TypeScript and will be hosted on Shuttle.dev or similar static hosting
> - Does TensorFlow have a TypeScript counterpart?
> - How does WebGPU work with hosting? Does it assume the hosting service has GPUs available, or is GPU usage resolved by referring to some other server that has GPUs?
> - What would the expected performance be for:
>   - M1 iMac for WebGPU
>   - Linux machine with a standard NVIDIA card
>   - 15" 2018 Intel-based MacBook Pro with Radeon Pro Vega 20 4 GB and Intel UHD Graphics 630 1536 MB
>
> **Deliverables:**
> - Comprehensive feasibility analysis of all options
> - Performance comparison across different hardware configurations
> - Detailed explanation of how WebGPU works (client-side vs server-side)
> - Implementation guidance with code examples
> - Recommendations based on use case (educational demo vs production)
> - All analysis should be consolidated into a single document with proper cross-references

### Summary of Generated Analysis

The prompt above resulted in:

1. **Performance-Options.md** - Comprehensive 1,123-line analysis document including:
   - Initial request and confirmation of performance concerns
   - Quick reference summary with decision matrix
   - Detailed feasibility evaluation of all 5+ options:
     - PyTorch/TensorFlow backend (Option 1)
     - CUDA or Mojo backend (Option 2)
     - Mathematica implementation (Option 3)
     - Mojo direct implementation (Option 4)
     - WebGPU with TensorFlow.js (Additional Option)
   - Complete WebGPU implementation guide with:
     - Client-side GPU architecture explanation
     - Hardware performance comparisons (M1 iMac, NVIDIA RTX 3060/3070, 2018 MacBook Pro)
     - Integration examples and TypeScript code snippets
     - Browser support and limitations
     - Shuttle.dev deployment guidance

2. **Key Findings:**
   - **Confirmed:** TypeScript implementation will be slow for dense tensors without GPU acceleration
   - **Primary Recommendation:** TensorFlow.js with WebGPU backend for client-side GPU acceleration
   - **Alternative:** PyTorch/TensorFlow backend for server-side maximum performance
   - **WebGPU Architecture:** Uses user's browser/device GPU, not server GPU (perfect for static hosting)

3. **Hardware Performance Expectations:**
   - M1 iMac: ~900 GFLOPS, 10-50x speedup, excellent for educational demos
   - NVIDIA RTX 3060/3070: ~1,500-2,500 GFLOPS, 50-200x speedup, best for large-scale operations
   - 2018 MacBook Pro (Vega 20): ~500-800 GFLOPS, 5-30x speedup, good for medium-scale operations

4. **Documentation Organization:**
   - Created `docs/README.md` as documentation index
   - Created `README_dev.md` for development setup
   - Reorganized main `README.md` to focus on project overview
   - All documentation cross-referenced and properly linked

---

## CI/CD - with Auto mode in Cursor

### CI/CD Consolidated Prompt

> Set up a complete CI/CD pipeline for the Tensor Logic project with the following requirements:
>
> **Build Timestamp Feature:**
> - Add a date/time-stamp version string in "YYYY-MM-DD_HH:MM" format to the bottom of the sidebar
> - The timestamp should reflect when the app was most recently built and update on every build
> - Add a mailto link on the same line: "Questions? Comment? Please email me." with address "sam@samkirk.com"
>
> **GitHub Actions CI Setup:**
> - Create a GitHub Actions workflow that runs on every push to `main`/`master` and on pull requests
> - The workflow should:
>   - Run TypeScript type checking (`tsc --noEmit`)
>   - Run ESLint linting
>   - Build the application (`vite build`)
>   - Build TypeScript scripts (`tsc -p tsconfig.scripts.json`)
>   - Upload build artifacts for 7 days
> - Use Node.js 20 with npm caching
> - Ensure the workflow file is properly configured and will trigger automatically
>
> **Repository Setup:**
> - Rename the local branch from `samkirk` to `main` to match GitHub's default
> - Set up SSH authentication with 1Password for seamless credential management
> - Configure git to use SSH instead of HTTPS (no credential prompts)
> - Connect local repository to GitHub remote
>
> **Documentation:**
> - Create comprehensive CI/CD setup guide (`docs/CI_CD.md`) that includes:
>   - Step-by-step instructions for GitHub Actions CI setup
>   - Instructions for getting GitHub Personal Access Token (for Cursor MCP)
>   - SSH authentication setup with 1Password (preferred method)
>   - Repository creation and connection steps
>   - Workflow configuration and troubleshooting
>   - Deployment instructions for Shuttle.dev
>   - Clear explanations of when CI runs and how to control it
> - Use "MrBesterTester" as the GitHub username in examples
> - Prioritize SSH over HTTPS in all instructions
> - Include helpful tips (e.g., refreshing browser to see new workflow runs)
>
> **Code Quality:**
> - Fix any lint errors (e.g., use `@ts-expect-error` instead of `@ts-ignore` when needed)
> - Ensure all TypeScript code compiles without errors
> - Remove unused directives when TypeScript declarations make them unnecessary
>
> **Testing:**
> - Verify the CI workflow runs successfully on GitHub
> - Ensure build artifacts are generated and uploaded correctly
> - Test that the workflow triggers automatically on pushes

### CI/CD Summary of Generated Features

The prompt above resulted in:

1. **Build Timestamp Feature** (`src/main.ts`, `vite.config.ts`, `src/vite-env.d.ts`)
   - Build timestamp in `YYYY-MM-DD_HH:MM` format injected at build time via Vite
   - Displayed in sidebar footer with mailto link on the same line
   - TypeScript declaration file for `__BUILD_TIME__` global constant
   - Proper styling with flexbox layout

2. **GitHub Actions CI Workflow** (`.github/workflows/ci.yml`)
   - Automated CI pipeline running on push to `main`/`master` and pull requests
   - Steps: checkout, Node.js 20 setup, dependency installation, linting, type checking, builds
   - Build artifacts uploaded and retained for 7 days
   - Successfully tested and passing

3. **Repository Configuration**
   - Branch renamed from `samkirk` to `main`
   - SSH authentication configured with 1Password SSH Agent
   - Git remote switched from HTTPS to SSH (`git@github.com:MrBesterTester/tensor-logic.git`)
   - Credential helper disabled to work seamlessly with 1Password

4. **Comprehensive CI/CD Documentation** (`docs/CI_CD.md`)
   - 524-line complete setup guide with:
     - Step 0: GitHub Personal Access Token setup (for Cursor MCP)
     - Step 1: Workflow file creation
     - Step 2: GitHub Secrets configuration
     - Step 3: Repository creation and connection (SSH preferred)
     - Step 3.5: SSH authentication setup with 1Password (detailed instructions)
     - Step 4: Push and test workflow
   - Deployment instructions for Shuttle.dev
   - Workflow configuration details (what gets tested, when CI runs, how to skip)
   - Troubleshooting section
   - All examples use "MrBesterTester" as GitHub username

5. **Code Quality Improvements**
   - Fixed lint errors (replaced `@ts-ignore` with `@ts-expect-error`)
   - Removed unused TypeScript directives when declarations made them unnecessary
   - All code passes linting and type checking

6. **Key Features of the Documentation:**
   - SSH authentication prioritized over HTTPS
   - Clear step-by-step instructions with code examples
   - Helpful tips (e.g., refreshing browser to see new workflow runs)
   - Troubleshooting guidance
   - Visual workflow diagram showing local → CI → deployment flow

---

## md review problems - with Auto mode in Cursor

### md review problems Consolidated Prompt

> Fix the following Cursor workflow issues:
>
> **Markdown File Opening Problem:**
> - A markdown file (`docs/prompts.md`) cannot be opened in Cursor, showing error: "The editor could not be opened due to an unexpected error"
> - The backup file (`docs/prompts.md.backup`) opens fine, suggesting the issue is related to markdown preview/rendering mode
> - I want markdown files to open in preview mode automatically, but this specific file crashes when trying to open in preview
> - Fix the file so it can open in preview mode, or configure workspace settings appropriately
>
> **Local Commit Command:**
> - I want a simple way to commit all outstanding work to the local git repository only (no push to remote)
> - I'd like to be able to simply say "commit locally" in the chat and have you execute `git add -A && git commit` with an appropriate commit message
> - This should be a conversational command - when I type "commit locally", you should recognize it and perform the local commit operation
>
> **Additional Considerations:**
> - Check Cursor's local settings files first before searching the web for Cursor-specific features
> - Understand that as an AI running inside Cursor, you should have direct knowledge of Cursor's capabilities
> - When investigating issues, prioritize checking local configuration files over web searches

### md review problems Summary of Generated Features

The prompt above resulted in:

1. **Markdown Preview Configuration** (`.vscode/settings.json`)
   - Configured workspace settings to enable automatic markdown preview mode
   - Set `workbench.editorAssociations` to open `*.md` files in preview editor
   - Added markdown preview settings (font size, line height, scroll synchronization)
   - Fixed file corruption issue by replacing problematic file with working backup
   - Cleared extension cache that was causing preview mode crashes

2. **Local Commit Command Recognition**
   - Established conversational pattern: when user types "commit locally", AI recognizes and executes local commit
   - Implementation: `git add -A && git commit` with appropriate commit message
   - No push to remote - commits stay local only
   - User can simply say "commit locally" in chat to trigger the operation

3. **Key Learnings:**
   - **Markdown Preview Issues:** Can be caused by corrupted extension cache or file metadata issues
   - **Solution:** Clear cache, recreate file cleanly, configure workspace settings for preview mode
   - **Cursor Settings:** Check local configuration files (`~/.cursor/User/settings.json`, `.vscode/settings.json`) before searching web
   - **AI Capabilities:** As AI running in Cursor, should prioritize local file inspection over web searches for Cursor-specific features
   - **Conversational Commands:** Simple phrases like "commit locally" can be recognized and executed without needing custom `@` commands or aliases
