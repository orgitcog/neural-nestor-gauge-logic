# CI/CD Setup Guide for Tensor Logic

<!-- TOC -->

- [Purpose](#purpose)
- [Overview](#overview)
- [GitHub Actions CI Setup](#github-actions-ci-setup)
  - [Step 0: Get GitHub Personal Access Token (Optional)](#step-0-get-github-personal-access-token-optional)
  - [Step 1: Create Workflow File](#step-1-create-workflow-file)
  - [Step 2: Configure GitHub Secrets (if needed)](#step-2-configure-github-secrets-if-needed)
  - [Step 3: Create GitHub Repository (if needed)](#step-3-create-github-repository-if-needed)
  - [Step 3.5: Set Up SSH Authentication (Optional but Recommended)](#step-35-set-up-ssh-authentication-optional-but-recommended)
  - [Step 4: Push and Test](#step-4-push-and-test)
- [Deployment to Shuttle](#deployment-to-shuttle)
  - [How Shuttle Connects to GitHub](#how-shuttle-connects-to-github)
  - [Prerequisites](#prerequisites)
  - [Initial Setup](#initial-setup)
  - [Setting Up GitHub Actions Deployment](#setting-up-github-actions-deployment)
  - [Deployment Process](#deployment-process)
- [Workflow Configuration](#workflow-configuration)
  - [What Gets Tested](#what-gets-tested)
  - [When CI Runs](#when-ci-runs)
  - [Skipping CI (Optional)](#skipping-ci-optional)
  - [Controlling CI](#controlling-ci)
- [Troubleshooting](#troubleshooting)
  - [CI Fails But Local Build Works](#ci-fails-but-local-build-works)
  - [Deployment Fails](#deployment-fails)
  - [Secrets Not Working](#secrets-not-working)
- [Next Steps](#next-steps)
- [Project Scripts](#project-scripts)
  - [generate-toc.ts](#generate-tocts)
  - [check-dns-propagation.ts](#check-dns-propagationts)
  - [verify-domain-setup.ts](#verify-domain-setupts)
- [Custom Domain Configuration](#custom-domain-configuration)
  - [Overview](#overview)
  - [Prerequisites](#prerequisites)
  - [Setup Procedure (Automated)](#setup-procedure-automated)
  - [Manual Procedures](#manual-procedures)
  - [Troubleshooting](#troubleshooting)
  - [SSL Certificate Management](#ssl-certificate-management)
  - [Cost Considerations](#cost-considerations)
  - [Quick Reference Card](#quick-reference-card)

<!-- /TOC -->

## Purpose

This guide provides step-by-step instructions for setting up:

1. **GitHub Actions CI** - Automated testing on every push
2. **Shuttle Deployment** - Deploy the static site to Shuttle.dev

**Key Principle:** CI runs tests automatically on every push. Deployment can be automatic via GitHub Actions (recommended) or manual via CLI - you control which approach to use.

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│  LOCAL DEVELOPMENT                                          │
│                                                              │
│  1. Write code                                              │
│  2. Test locally: npm run build && npm run lint            │
│  3. Commit: git commit -m "feature"                        │
│  4. Push: git push origin main                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ git push
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS CI                                          │
│                                                              │
│  5. Automatically runs:                                    │
│     - Type checking (tsc)                                  │
│     - Linting (eslint)                                     │
│     - Build (vite build)                                   │
│  6. Reports: ✅ PASS or ❌ FAIL                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ (CI passes, on main branch)
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  GITHUB ACTIONS DEPLOYMENT                                  │
│                                                              │
│  7. Automatically runs (if configured):                    │
│     - Builds frontend (npm run build)                      │
│     - Deploys to Shuttle (shuttle deploy)                  │
│  8. App is live at: https://your-app.shuttle.app          │
└─────────────────────────────────────────────────────────────┘

Alternative: Manual Deployment
────────────────────────────────
After CI passes, you can also deploy manually:
  cd backend && shuttle deploy
```

---

## GitHub Actions CI Setup

### Step 0: Get GitHub Personal Access Token (Optional)

If you plan to use the GitHub MCP server in Cursor, you'll need a GitHub Personal Access Token:

1. **Go to GitHub Settings:**
   - Log in to your GitHub account
   - Click your profile picture (top right) → **Settings**
   - In the left sidebar, click **Developer settings**

2. **Create a New Token:**
   - Under **Personal access tokens**, click **Tokens (classic)**
   - Click **Generate new token (classic)**

3. **Configure the Token:**
   - **Note:** Give it a descriptive name (e.g., "Cursor MCP")
   - **Expiration:** Choose an expiration period
   - **Scopes:** Select `repo` (full control of private repositories)
   - Click **Generate token**

4. **Copy the Token:**
   - **Important:** Copy the token immediately - you won't be able to see it again!
   - Add it to your `~/.cursor/mcp.json` file in the `env` section of the GitHub MCP server:
     ```json
     {
       "mcpServers": {
         "github": {
           "command": "npx",
           "args": ["-y", "github-mcp@latest"],
           "env": {
             "GITHUB_PERSONAL_ACCESS_TOKEN": "paste_your_token_here"
           }
         }
       }
     }
     ```
   - Reload Cursor to apply changes:
     - Press `Cmd+Shift+P` → Type "Reload Window" → Select it
     - Or fully restart Cursor if needed

**Direct link:** https://github.com/settings/tokens

**Note:** 
- This step is only needed if you want to use GitHub MCP features in Cursor. It's not required for GitHub Actions CI to work.
- The GitHub MCP server uses the npm package `github-mcp` (no Docker required).
- After adding the token, use "Reload Window" command (`Cmd+Shift+P`) instead of a full restart.

### Step 1: Create Workflow File

Create the GitHub Actions workflow file:

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Run type check
        run: npm run typecheck
        
      - name: Type check scripts
        run: npm run typecheck:scripts
        
      - name: Build application
        run: npm run build
        
      - name: Build scripts
        run: npm run build:scripts
        
      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7
```

**What this does:**
- Runs on every push to `main`/`master` and on pull requests
- Installs Node.js 20 with npm caching
- Runs linting, type checking, and builds
- Uploads build artifacts for 7 days

### Step 2: Configure GitHub Secrets (if needed)

For this project, **no secrets are required** for CI since it's a static frontend app with no API keys.

If you add features that require secrets later:
1. Go to: `https://github.com/MrBesterTester/tensor-logic/settings/secrets/actions`
2. Click "New repository secret"
3. Add secrets as needed
4. Reference in workflow: `${{ secrets.SECRET_NAME }}`

### Step 3: Create GitHub Repository (if needed)

If you haven't created a GitHub repository for this project yet:

1. **Go to GitHub.com:**
   - Log in to your GitHub account
   - Click the "+" icon (top right) → **New repository**

2. **Create the repository:**
   - **Repository name:** `tensor-logic`
   - **Description:** (optional) "Educational demo of Tensor Logic - unifying neural and symbolic AI"
   - **Visibility:** Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click **Create repository**

3. **Connect your local repo to GitHub:**

   **Option A: Using SSH (recommended, works with 1Password):**
   ```bash
   git remote add origin git@github.com:MrBesterTester/tensor-logic.git
   ```

   **Option B: Using HTTPS (requires credentials each time):**
   ```bash
   git remote add origin https://github.com/MrBesterTester/tensor-logic.git
   ```

**Note:** If the repository already exists and is connected, skip this step.

### Step 3.5: Set Up SSH Authentication (Optional but Recommended)

Using SSH with 1Password eliminates credential prompts and provides seamless authentication:

1. **Generate SSH Key in 1Password:**
   - Open 1Password desktop app
   - Click "New Item" → Select "SSH Key"
   - Click "Add Private Key" → "Generate a New Key"
   - Choose **Ed25519** (recommended) or RSA
   - Title it: "GitHub - tensor-logic" (or similar)
   - Click "Generate" then "Save"

2. **Copy the Public Key:**
   - In 1Password, open the SSH Key item you created
   - Click the "Public Key" field to copy it to your clipboard

3. **Add Public Key to GitHub:**
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - **Title:** "MacBook Pro - 1Password" (or similar descriptive name)
   - **Key type:** Authentication Key
   - **Key:** Paste the public key from 1Password
   - Click "Add SSH key"

4. **Enable 1Password SSH Agent:**
   - In 1Password: **Preferences** → **Developer**
   - Check "Use 1Password as SSH Agent"
   - Follow any additional setup instructions shown

5. **Test SSH Connection:**
   ```bash
   ssh -T git@github.com
   ```
   You should see: `Hi MrBesterTester! You've successfully authenticated, but GitHub does not provide shell access.`

6. **Switch Git Remote to SSH (if you used HTTPS initially):**
   ```bash
   git remote set-url origin git@github.com:MrBesterTester/tensor-logic.git
   ```

**Benefits of SSH:**
- ✅ No credential prompts (handled by 1Password)
- ✅ More secure (key-based authentication)
- ✅ Works seamlessly with 1Password SSH Agent
- ✅ No need to manage tokens or passwords

**Alternative:** If you prefer to use your existing SSH keys instead of generating new ones in 1Password:
- Copy your existing public key: `cat ~/.ssh/id_ed25519.pub`
- Add it to GitHub (same steps as above)
- Import the private key into 1Password if you want 1Password to manage it

### Step 4: Push and Test

1. **Commit and push:**
   ```bash
   git add .github/
   git commit -m "Add GitHub Actions CI workflow"
   git push origin main
   ```

2. **Watch it run:**
   - Go to GitHub.com in your browser: `https://github.com/MrBesterTester/tensor-logic/actions`
   - You should see a workflow run start automatically (appears within seconds of pushing)
   - **Tip:** On subsequent runs, refresh the page or navigate back to this link to see the latest run. Otherwise, you'll be looking at the last run you viewed.
   - Click on the workflow run to watch live logs
   - Should complete in ~2-3 minutes

3. **Verify:**
   - Green ✅ checkmark appears on your commit
   - All steps should pass

---

## Deployment to Shuttle

### How Shuttle Connects to GitHub

Shuttle offers **two ways** to deploy from GitHub:

1. **GitHub Integration (via Shuttle Console)** - Shuttle automatically pulls code from GitHub
   - ✅ Simple setup through web console
   - ✅ Automatic deployments on push (if enabled)
   - ❌ **Not suitable for this project** - requires code to be ready to deploy without build steps
   - ❌ This project needs `npm run build` before deployment

2. **GitHub Actions** - Use CI workflow to build and deploy
   - ✅ Perfect for projects that need build steps (like this one)
   - ✅ Build happens in GitHub Actions, then deploys to Shuttle
   - ✅ Full control over build process
   - ✅ **Recommended for this project**

**For this project:** Since we need to run `npm run build` before deployment, we'll use **GitHub Actions** to handle both building and deploying.

### Prerequisites

1. **Install Shuttle CLI (for initial setup and testing):**
   ```bash
   cargo install cargo-shuttle
   ```

2. **Login to Shuttle:**
   ```bash
   shuttle login
   ```
   This opens your browser to authenticate. Save your API key when prompted.

3. **Get your Shuttle API Key:**
   - After logging in, get your API key from: https://console.shuttle.dev/account/api-keys
   - You'll need this for the GitHub Actions workflow

4. **Create a project and get your Project ID:**
   ```bash
   # Create a new project
   shuttle project create --name tensor-logic
   
   # Or list existing projects to see their IDs
   shuttle project list
   ```
   - Project ID starts with `proj_` (e.g., `proj_0123456789`)
   - You'll need this ID for the GitHub Actions workflow

### Initial Setup

<Note>
**Chatbot Assistance:** The entire Initial Setup section (Steps 1-4) can be handled automatically by asking the chatbot/AI assistant to "do Initial Setup" or "set up the Shuttle backend". The chatbot will create the backend directory, initialize the Shuttle project, configure the Rust code to serve static files, and set up the necessary files.
</Note>

Since this is a **static frontend project** (not a Rust backend), you need to create a minimal Rust backend that serves the built files:

1. **Create a backend directory:**
   ```bash
   mkdir backend
   cd backend
   ```

2. **Initialize Shuttle project:**
   ```bash
   shuttle init --name tensor-logic --template axum
   ```

3. **Modify to serve static files:**
   - Update `src/main.rs` to serve files from `dist` (files are built directly to `backend/tensor-logic/dist/`)
   - Configure routing for SPA (serve `index.html` for all routes)

4. **Test deployment locally (optional):**
   ```bash
   # In project root
   npm run build
   cd backend/tensor-logic
   shuttle deploy
   ```

### Setting Up GitHub Actions Deployment

<Note>
**Chatbot Assistance:** Step 2 (updating the CI workflow) can be handled automatically by asking the chatbot/AI assistant to "set up GitHub Actions deployment" or "add deployment job to CI workflow". The chatbot will:
- Read the current workflow file
- Get the Shuttle project ID automatically using `shuttle project status` (if the project is linked)
- Add the deployment job with the correct configuration
- Update the workflow file with the correct project ID and paths

**Manual Step Required:** Step 1 (adding GitHub secrets) must be done manually through the GitHub web interface, as it requires your Shuttle API key and GitHub UI access. The chatbot cannot access GitHub's secret management UI.
</Note>

To deploy automatically from GitHub Actions:

1. **Add Shuttle secrets to GitHub (Manual - Required):**
   - Go to: `https://github.com/MrBesterTester/tensor-logic/settings/secrets/actions`
   - Click "New repository secret"
   - Add `SHUTTLE_API_KEY` with your API key from Shuttle Console
   - Add any other secrets your project needs
   
   **Note:** This step cannot be automated and must be done through the GitHub web interface.

2. **Update your CI workflow** to include deployment:

   **File:** `.github/workflows/ci.yml`

   Add a deployment job after the build job:

   ```yaml
   name: CI

   on:
     push:
       branches: [ main, master ]
     pull_request:
       branches: [ main, master ]

   jobs:
     build-and-test:
       runs-on: ubuntu-latest
       
       steps:
         - name: Checkout code
           uses: actions/checkout@v4
           
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
             
         - name: Install dependencies
           run: npm ci
           
         - name: Run linter
           run: npm run lint
           
         - name: Run type check
           run: npm run typecheck
           
         - name: Type check scripts
           run: npm run typecheck:scripts
           
         - name: Build application
           run: npm run build
           
         - name: Build scripts
           run: npm run build:scripts
           
         - name: Upload build artifacts
           uses: actions/upload-artifact@v4
           with:
             name: dist
             path: backend/tensor-logic/dist/
             retention-days: 7

     deploy:
       needs: build-and-test
       runs-on: ubuntu-latest
       if: github.ref == 'refs/heads/main' && github.event_name == 'push'
       
       steps:
         - name: Checkout code
           uses: actions/checkout@v4
           
         - name: Setup Rust
           uses: actions-rs/toolchain@v1
           with:
             toolchain: stable
             
         - name: Install cargo-shuttle
           run: cargo install cargo-shuttle
           
         - name: Build frontend
           uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
           run: |
             npm ci
             npm run build
             
         - name: Deploy to Shuttle
           uses: shuttle-hq/deploy-action@v2
           with:
             shuttle-api-key: ${{ secrets.SHUTTLE_API_KEY }}
             project-id: proj_YOUR_PROJECT_ID_HERE
             working-directory: backend/tensor-logic
   ```

   **Important:** Replace `proj_YOUR_PROJECT_ID_HERE` with your actual Shuttle project ID.

3. **Alternative: Use Shuttle Deploy Action (simpler):**

   If you prefer, you can use the official Shuttle deploy action which handles Rust setup:

   ```yaml
   - name: Build frontend
     uses: actions/setup-node@v4
     with:
       node-version: '20'
       cache: 'npm'
     run: |
       npm ci
       npm run build
       
   - name: Deploy to Shuttle
     uses: shuttle-hq/deploy-action@v2
     with:
       shuttle-api-key: ${{ secrets.SHUTTLE_API_KEY }}
       project-id: proj_YOUR_PROJECT_ID_HERE
       working-directory: backend/tensor-logic
       extra-args: "--allow-dirty"
   ```

### Deployment Process

**How it works:**

1. **You push code to GitHub** → `git push origin main`
2. **GitHub Actions runs CI** → Tests and builds your app
3. **If CI passes and on main branch** → Deployment job runs automatically
4. **Deployment job:**
   - Checks out code
   - Builds frontend (`npm run build`)
   - Deploys to Shuttle using `shuttle deploy`
5. **Your app is live** at your Shuttle URL

**Manual deployment (for testing):**

If you want to deploy manually from your local machine:

```bash
# 1. Ensure CI passed (check GitHub Actions)
#    Go to: https://github.com/MrBesterTester/tensor-logic/actions
#    Verify: Latest run shows green ✅

# 2. Build locally
npm run build

# 3. Deploy to Shuttle
cd backend
shuttle deploy

# 4. Verify deployment
#    Check the URL provided by Shuttle
```

**Timeline:**
- CI runs: ~2-3 minutes after push
- Deployment (via GitHub Actions): ~2-5 minutes after CI passes
- Manual deployment: ~2-5 minutes after `shuttle deploy`

---

## Workflow Configuration

### What Gets Tested

**In CI:**
- ✅ TypeScript type checking (`tsc --noEmit`)
- ✅ ESLint code quality checks
- ✅ Application build (`vite build`)
- ✅ Scripts build (`tsc -p tsconfig.scripts.json`)

**Not tested in CI:**
- ❌ Browser-based E2E tests (requires browser automation setup)
- ❌ Visual regression tests
- ❌ Performance benchmarks

### When CI Runs

**CI automatically runs when:**
- ✅ You push code to `main` or `master` branch (`git push origin main`)
- ✅ You create or update a pull request targeting `main` or `master`
- ✅ You manually trigger it from the GitHub Actions tab (if configured)

**CI does NOT run when:**
- ❌ You commit locally without pushing (`git commit` - stays local)
- ❌ You push to other branches (unless you configure it to)
- ❌ You make changes but don't commit them

**Important:** CI only runs **after** you push to GitHub. You have full control - if you don't push, CI doesn't run.

### Skipping CI (Optional)

**Method 1: Don't Push (Simplest)**
The easiest way to skip CI is to simply not push:
```bash
git commit -m "WIP: experimental work"
# Don't push yet - CI won't run
# Continue working, make more commits...
# When ready: git push origin main
```

**Method 2: Push to a Different Branch**
Push to a feature branch that doesn't trigger CI:
```bash
git checkout -b wip/experimental
git commit -m "experimental changes"
git push origin wip/experimental
# CI won't run (only main/master trigger it)
```

**That's it!** These two methods cover all practical use cases. You control when CI runs by choosing when and where to push.

### Controlling CI

**Temporarily disable:**
```bash
# Rename workflow file
mv .github/workflows/ci.yml .github/workflows/ci.yml.disabled
git add .github/
git commit -m "Temporarily disable CI"
git push
```

**Permanently remove:**
```bash
git rm .github/workflows/ci.yml
git commit -m "Remove CI"
git push
```

---

## Troubleshooting

### CI Fails But Local Build Works

**Common causes:**
1. **Node version mismatch**
   - Solution: Ensure CI uses same Node version as local
   - Check: `node --version` locally vs workflow file

2. **Missing dependencies**
   - Solution: Ensure `package-lock.json` is committed
   - Run: `npm ci` (not `npm install`) in CI

3. **Path issues**
   - Solution: CI runs from repo root, ensure paths are relative

4. **Cached dependencies**
   - Solution: GitHub Actions caches npm, but first run is slower

### Deployment Fails

**Common issues:**
1. **Shuttle not logged in**
   - Solution: Run `shuttle login` again

2. **Build artifacts missing**
   - Solution: Ensure `npm run build` runs before `shuttle deploy`

3. **Wrong directory**
   - Solution: Ensure you're in the correct directory when deploying

### Secrets Not Working

**If you add secrets later:**
1. Verify secrets exist: GitHub repo → Settings → Secrets → Actions
2. Check secret names match exactly (case-sensitive)
3. Reference correctly: `${{ secrets.SECRET_NAME }}`
4. Re-run workflow after adding secrets

---

## Next Steps

**Immediate:**
1. ✅ Create `.github/workflows/ci.yml` with the workflow above
2. ✅ Commit and push to trigger first CI run
3. ✅ Verify CI passes

**Future enhancements:**
1. **Add E2E tests** - Playwright or Cypress in CI
2. **Deploy to Shuttle** - Set up static site hosting
3. **GitHub Pages** - Alternative deployment option (free)
4. **Preview deployments** - Deploy PRs to staging
5. **Performance monitoring** - Track build sizes over time
6. **Dependency updates** - Enable Dependabot

**Remember:**
- CI runs automatically on push
- Deployment is always manual (`shuttle deploy`)
- You control when code is pushed and deployed
- CI validates code quality, deployment releases to users

---

**Questions or issues?** Check the [GitHub Actions documentation](https://docs.github.com/en/actions) or [Shuttle documentation](https://docs.shuttle.dev/).

---

## Project Scripts

This project includes several automation scripts in the `scripts/` directory. All scripts are written in TypeScript with strict type checking and must be built before use.

**Note:** All scripts in this directory are written in TypeScript with strict type checking. When creating new scripts, use TypeScript and ensure they compile with `npm run build:scripts`.

### generate-toc.ts

Automatically generates a 3-level Table of Contents (TOC) for Markdown files.

**Usage:**

The script is written in TypeScript and must be built first:

```bash
npm run build:scripts
node scripts/dist/generate-toc.js <path-to-markdown-file>
```

Or use the TypeScript source directly with a TypeScript runner (if you have one installed):

```bash
npx tsx scripts/generate-toc.ts <path-to-markdown-file>
```

**Features:**

- Generates TOC for H1, H2, and H3 headings
- Automatically inserts/updates TOC between `<!-- TOC -->` and `<!-- /TOC -->` markers
- Creates anchor links using slugified heading text
- Preserves existing TOC if markers are present, otherwise inserts after first H1

**Git Hook:**

A pre-commit hook is installed at `.git/hooks/pre-commit` that automatically generates TOCs for all staged `.md` files before each commit.

**Manual TOC Generation:**

To manually generate TOC for all markdown files:

```bash
npm run build:scripts
find docs -name "*.md" -exec node scripts/dist/generate-toc.js {} \;
```

### check-dns-propagation.ts

Monitors DNS propagation for a CNAME record. Polls DNS servers until the record is found or timeout is reached.

**Usage:**

```bash
npm run build:scripts
node scripts/dist/check-dns-propagation.js <domain> <target>
```

**Example:**
```bash
node scripts/dist/check-dns-propagation.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app
```

**Features:**

- Checks CNAME record propagation status
- Polls every 5 minutes (configurable)
- Maximum 48 attempts (4 hours) by default
- Provides real-time status updates
- Exits when propagation is complete or timeout reached

**Options:**
- `intervalSeconds`: Time between checks (default: 300 seconds / 5 minutes)
- `maxAttempts`: Maximum number of attempts (default: 48)

### verify-domain-setup.ts

Comprehensive verification script that checks all aspects of custom domain configuration for Shuttle deployments.

**Usage:**

```bash
npm run build:scripts
node scripts/dist/verify-domain-setup.js <domain> <shuttle-url>
```

**Example:**
```bash
node scripts/dist/verify-domain-setup.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app
```

**Features:**

- **DNS Resolution Check:** Verifies domain resolves to IP addresses
- **CNAME Record Check:** Verifies CNAME points to correct Shuttle URL
- **HTTP Access Check:** Tests HTTP connectivity
- **HTTPS Access Check:** Tests HTTPS connectivity
- **SSL Certificate Check:** Verifies SSL certificate is valid and shows expiration date
- Provides comprehensive status report with pass/fail indicators

**Output:**
- ✅ Green checkmarks for passing checks
- ⚠️ Warning indicators for potential issues
- ❌ Red X for failing checks
- Detailed messages for each check

---

## Custom Domain Configuration

### Overview

This section provides step-by-step instructions for configuring a custom subdomain (e.g., `tensor-logic.samkirk.com`) to point to your Shuttle-hosted application instead of using the default Shuttle-provided URL.

**Goal:** Users access your app at `https://tensor-logic.samkirk.com` instead of `https://tensor-logic-noo5.shuttle.app`

**Architecture:**
```
User → tensor-logic.samkirk.com
         ↓ (DNS CNAME)
       tensor-logic-noo5.shuttle.app (Shuttle-provided URL)
         ↓
       Your Shuttle-hosted app
```

### Prerequisites

**What You Need:**
- ✅ Shuttle project deployed: `tensor-logic` (Project ID: `proj_01KCJDQWVDRP2A38R07R3M30F4`)
- ✅ Current Shuttle URL: `https://tensor-logic-noo5.shuttle.app`
- ✅ Domain ownership: `samkirk.com`
- ✅ Access to DNS management for `samkirk.com` (Microsoft/Azure DNS)
- ✅ Shuttle CLI installed and authenticated

**What You'll Create:**
- CNAME record: `tensor-logic.samkirk.com` → `tensor-logic-noo5.shuttle.app`
- SSL certificate for HTTPS access

### Setup Procedure (Automated)

This streamlined procedure uses automation scripts wherever possible. Manual procedures are available as backups in the [Manual Procedures](#manual-procedures) section below.

**Prerequisites:**
- Build the automation scripts: `npm run build:scripts`
- Have your Shuttle URL ready (or get it in Step 1)

#### Step 1: Get Your Shuttle URL

```bash
cd backend/tensor-logic
shuttle project status
```

**Expected Output:**
```
Project info:
  Project ID: proj_01KCJDQWVDRP2A38R07R3M30F4
  Project Name: tensor-logic
  URIs:
    - https://tensor-logic-noo5.shuttle.app
```

**Note:** The chatbot can run this command automatically. Save the URL for use in subsequent steps.

#### Step 2: Add CNAME Record (Manual - Required)

Add a CNAME record at your DNS registrar:
- **Host:** `tensor-logic`
- **Points to:** `tensor-logic-noo5.shuttle.app` (your Shuttle URL from Step 1)

**Quick Reference:**
- **Microsoft 365 Admin Center:** See [Manual DNS Configuration](#manual-dns-configuration) below
- **Azure DNS:** See [Manual DNS Configuration](#manual-dns-configuration) below
- **Azure CLI:** The chatbot can help generate Azure CLI commands if you provide the resource group name

**Note:** This is the only manual step required. All subsequent steps can be automated.

#### Step 3: Monitor DNS Propagation (Automated)

Use the automated script to monitor DNS propagation:

```bash
npm run build:scripts
node scripts/dist/check-dns-propagation.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app
```

**What the script does:**
- Checks if DNS has already propagated (exits immediately if found)
- Polls every 5 minutes until the CNAME record is found
- Continues for up to 4 hours (48 attempts) by default
- Exits when propagation is complete or timeout is reached

**Timeline:** Typically 1-4 hours, but can take up to 24-48 hours.

**Alternative:** See [Manual DNS Checks](#manual-dns-checks) below if you prefer manual verification.

**Chatbot Assistance:** The chatbot can run this script automatically for you.

#### Step 4: Add SSL Certificate (Automated)

Once DNS has propagated (Step 3 completes), add the SSL certificate:

```bash
cd backend/tensor-logic
shuttle certificate add tensor-logic.samkirk.com
```

**Expected Output:**
```
Creating SSL certificate for tensor-logic.samkirk.com...
Certificate created successfully!

Your domain is now configured for HTTPS:
https://tensor-logic.samkirk.com
```

**If it fails:** DNS may not have propagated yet. Re-run Step 3 to verify, then retry.

**Chatbot Assistance:** The chatbot can run this command automatically once DNS propagation is confirmed.

#### Step 5: Verify Complete Setup (Automated)

Use the verification script to check all aspects of your domain configuration:

```bash
npm run build:scripts
node scripts/dist/verify-domain-setup.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app
```

**What the script checks:**
1. DNS Resolution - Verifies domain resolves to IP addresses
2. CNAME Record - Verifies CNAME points to correct Shuttle URL
3. HTTP Access - Tests HTTP connectivity
4. HTTPS Access - Tests HTTPS connectivity
5. SSL Certificate - Verifies SSL certificate is valid and shows expiration date

**Expected Output:**
```
🔍 Verifying domain setup for: tensor-logic.samkirk.com
   Expected Shuttle URL: tensor-logic-noo5.shuttle.app

1. Checking DNS resolution...
2. Checking CNAME record...
3. Checking HTTP access...
4. Checking HTTPS access...
5. Checking SSL certificate...

📊 Verification Results:
────────────────────────────────────────────────────────────
✅ DNS Resolution: Domain resolves to: <IP addresses>
✅ CNAME Record: CNAME correctly points to: tensor-logic-noo5.shuttle.app
✅ HTTP Access: HTTP accessible (status: 200)
✅ HTTPS Access: HTTPS accessible (status: 200)
✅ SSL Certificate: SSL certificate valid (expires: <date>)
────────────────────────────────────────────────────────────

✅ All checks passed! Domain is properly configured.
```

**Alternative:** See [Manual Verification](#manual-verification) below if you prefer manual checks.

**Chatbot Assistance:** The chatbot can run this script automatically and provide a status report.

**Done!** Your domain should now be accessible at `https://tensor-logic.samkirk.com`

### Manual Procedures

The following sections provide detailed manual procedures as alternatives to the automated scripts above.

#### Manual DNS Configuration

**Microsoft 365 Admin Center:**

1. Go to: [admin.microsoft.com](https://admin.microsoft.com)
2. Navigate to: **Settings → Domains**
3. Click on `samkirk.com`
4. Click: **DNS records** or **Manage DNS**
5. Click: **Add record**
6. Configure the CNAME record:
   - **Type:** CNAME
   - **Host name / Alias:** `tensor-logic`
   - **Points to address:** `tensor-logic-noo5.shuttle.app` (without https://)
   - **TTL:** 3600 (1 hour) or leave default
7. Click **Save**

**Azure DNS (Web UI):**

1. Sign in to Azure Portal: https://portal.azure.com
2. Search for "DNS zones" in the search bar
3. Select your subscription and click on `samkirk.com` zone
4. Click **+ Record set**
5. Configure:
   - **Name:** `tensor-logic`
   - **Type:** CNAME
   - **TTL:** 3600 seconds (1 hour)
   - **Alias:** `tensor-logic-noo5.shuttle.app`
6. Click **OK**

**Azure CLI:**

```bash
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "Your Subscription Name"

# Add CNAME record
az network dns record-set cname set-record \
  --resource-group YourResourceGroup \
  --zone-name samkirk.com \
  --record-set-name tensor-logic \
  --cname tensor-logic-noo5.shuttle.app

# Verify
az network dns record-set cname show \
  --resource-group YourResourceGroup \
  --zone-name samkirk.com \
  --name tensor-logic
```

#### Manual DNS Checks

**Check CNAME Record:**

```bash
# Mac/Linux
dig CNAME tensor-logic.samkirk.com

# Expected output:
# tensor-logic.samkirk.com. 3600 IN CNAME tensor-logic-noo5.shuttle.app.

# macOS alternative
nslookup -type=CNAME tensor-logic.samkirk.com
```

**Online Tools:**
- https://dnschecker.org/
- https://www.whatsmydns.net/

Search for: `tensor-logic.samkirk.com` (Type: CNAME)

#### Manual Verification

**Step-by-Step Manual Checks:**

```bash
# 1. Check DNS Resolution
dig +short tensor-logic.samkirk.com

# 2. Check CNAME Record
dig CNAME +short tensor-logic.samkirk.com

# 3. Test HTTP Access
curl -I http://tensor-logic.samkirk.com

# 4. Test HTTPS Access
curl -I https://tensor-logic.samkirk.com

# 5. Test in Browser
# Visit: https://tensor-logic.samkirk.com
```

### Troubleshooting

**Problem: "shuttle certificate add" Fails**

**Error:** `Error: Failed to validate domain ownership`

**Solution (Automated):**
```bash
# Use the DNS propagation script to verify status
npm run build:scripts
node scripts/dist/check-dns-propagation.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app

# Once propagation is complete, retry certificate
shuttle certificate add tensor-logic.samkirk.com
```

**Causes:**
1. DNS hasn't propagated yet (most common)
2. CNAME record is incorrect
3. TTL is too long

**Chatbot Assistance:** The chatbot can run the DNS propagation script and retry the certificate command automatically once propagation is confirmed.

**Problem: Browser Shows Security Warning**

**Error:** "Your connection is not private" or "NET::ERR_CERT_COMMON_NAME_INVALID"

**Solution (Automated):**
```bash
# Use verification script to check certificate status
npm run build:scripts
node scripts/dist/verify-domain-setup.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app
```

**Manual Fix:**
```bash
# List current certificates
shuttle certificate list

# If not present, add it
shuttle certificate add tensor-logic.samkirk.com

# If present but not working, delete and re-add
shuttle certificate delete tensor-logic.samkirk.com
shuttle certificate add tensor-logic.samkirk.com
```

**Chatbot Assistance:** The chatbot can check certificate status and fix issues automatically.

**Problem: Site Not Loading**

**Symptoms:** DNS_PROBE_FINISHED_NXDOMAIN or similar

**Solution (Automated):**

Use the verification script to diagnose all issues automatically:

```bash
npm run build:scripts
node scripts/dist/verify-domain-setup.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app
```

The script will check:
1. CNAME record exists and points to correct Shuttle URL
2. Shuttle app is running and accessible
3. DNS resolution from your location
4. HTTP/HTTPS connectivity
5. SSL certificate status

**Manual Checks:**
```bash
# 1. Check CNAME record exists
dig CNAME tensor-logic.samkirk.com

# 2. Verify Shuttle app is running
curl https://tensor-logic-noo5.shuttle.app

# 3. Check DNS from multiple locations
# Use: https://dnschecker.org/
```

**Chatbot Assistance:** The chatbot can run the verification script automatically to diagnose issues.

### SSL Certificate Management

**List Certificates:**
```bash
shuttle certificate list
```

**Add Certificate:**
```bash
shuttle certificate add tensor-logic.samkirk.com
```

**Delete Certificate:**
```bash
shuttle certificate delete tensor-logic.samkirk.com
```

**Certificate Auto-Renewal:**

Shuttle automatically renews Let's Encrypt certificates before expiration (typically 90 days). No manual intervention needed.

**To Verify Renewal (Automated):**

Use the verification script which includes SSL certificate expiration:

```bash
npm run build:scripts
node scripts/dist/verify-domain-setup.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app
```

The script will show the certificate expiration date in the SSL Certificate check.

**Manual Check:**
```bash
# Check certificate expiration
echo | openssl s_client -servername tensor-logic.samkirk.com \
  -connect tensor-logic.samkirk.com:443 2>/dev/null | \
  openssl x509 -noout -dates
```

**Chatbot Assistance:** The chatbot can run the verification script to check certificate expiration dates and renewal status automatically.

### Cost Considerations

**DNS Costs:**

**Microsoft 365:**
- DNS management included with Microsoft 365 subscription
- No additional cost for CNAME records

**Azure DNS:**
- First 25 hosted zones: $0.50/zone/month
- First 1 billion queries: $0.40 per million queries
- CNAME records: No additional charge

**Shuttle:**
- Custom domains: **Free** (included in all tiers)
- SSL certificates: **Free** (Let's Encrypt)

**Total Additional Cost:** $0-0.50/month (if using Azure DNS)

### Quick Reference Card

**Complete Setup Checklist (Automated):**

- [ ] Build scripts: `npm run build:scripts`
- [ ] Get Shuttle URL: `shuttle project status` (or use: `https://tensor-logic-noo5.shuttle.app`)
- [ ] Add CNAME record at DNS registrar (manual - see [Manual DNS Configuration](#manual-dns-configuration)):
  - Host: `tensor-logic`
  - Points to: `tensor-logic-noo5.shuttle.app`
- [ ] Monitor DNS propagation: `node scripts/dist/check-dns-propagation.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app`
- [ ] Add SSL: `shuttle certificate add tensor-logic.samkirk.com`
- [ ] Verify setup: `node scripts/dist/verify-domain-setup.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app`
- [ ] Test in browser: `https://tensor-logic.samkirk.com`

**Automation Scripts:**
- `scripts/check-dns-propagation.ts` - Monitor DNS propagation automatically
- `scripts/verify-domain-setup.ts` - Complete domain verification

**Chatbot Assistance:**
- Getting Shuttle URL automatically
- Running DNS propagation monitoring script
- Adding SSL certificates
- Running verification script
- Troubleshooting issues

**Support:**
- Shuttle Discord: https://discord.gg/shuttle
- Shuttle Docs: https://docs.shuttle.dev/
- Custom Domains: https://docs.shuttle.dev/docs/domain-names

---

**Document Version:** 1.0  
**Date:** 2025-12-16  
**Project:** tensor-logic  
**Domain:** tensor-logic.samkirk.com  
**Shuttle URL:** https://tensor-logic-noo5.shuttle.app

