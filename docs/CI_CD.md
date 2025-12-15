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
  - [Prerequisites](#prerequisites)
  - [Initial Setup](#initial-setup)
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

<!-- /TOC -->

## Purpose

This guide provides step-by-step instructions for setting up:

1. **GitHub Actions CI** - Automated testing on every push
2. **Shuttle Deployment** - Deploy the static site to Shuttle.dev

**Key Principle:** CI runs tests automatically, but deployment is manual and controlled by you.

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
                  │ (CI passes, ready to deploy)
                  │
                  │ YOU DECIDE: Deploy now?
                  │
                  │ Manual: shuttle deploy
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  SHUTTLE PRODUCTION                                         │
│                                                              │
│  7. Deploy: shuttle deploy                                  │
│  8. App is live at: https://your-app.shuttle.app           │
└─────────────────────────────────────────────────────────────┘
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

### Prerequisites

1. **Install Shuttle CLI:**
   ```bash
   cargo install cargo-shuttle
   ```

2. **Login to Shuttle:**
   ```bash
   shuttle login
   ```

3. **Verify installation:**
   ```bash
   shuttle --version
   ```

### Initial Setup

Since this is a **static frontend project** (not a Rust backend), you have two options:

#### Option A: Deploy as Static Site (Recommended)

Shuttle can serve static files. You'll need to create a minimal Rust backend that serves the built files:

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
   - Update `src/main.rs` to serve files from `../dist`
   - Configure routing for SPA (serve `index.html` for all routes)

4. **Add deployment script:**
   ```bash
   # In project root
   npm run build
   cd backend
   shuttle deploy
   ```

#### Option B: Use Shuttle Static (if available)

If Shuttle offers a static site hosting service:
```bash
shuttle deploy --static dist/
```

### Deployment Process

**Standard workflow:**

```bash
# 1. Ensure CI passed (check GitHub Actions)
#    Go to: https://github.com/MrBesterTester/tensor-logic/actions
#    Verify: Latest run shows green ✅

# 2. Build locally (optional, CI already did this)
npm run build

# 3. Deploy to Shuttle
cd backend  # If using Option A
shuttle deploy

# 4. Verify deployment
#    Check the URL provided by Shuttle
```

**Timeline:**
- CI runs: ~2-3 minutes after push
- Deployment: ~2-5 minutes after `shuttle deploy`
- Total: You control both steps independently

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

