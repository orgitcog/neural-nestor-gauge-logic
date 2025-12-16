# Scripts

<!-- TOC -->

- [generate-toc.ts](#generate-tocts)
  - [Usage](#usage)
  - [Features](#features)
  - [Git Hook](#git-hook)
  - [Manual TOC Generation](#manual-toc-generation)
- [check-dns-propagation.ts](#check-dns-propagationts)
  - [Usage](#usage)
  - [Features](#features)
- [verify-domain-setup.ts](#verify-domain-setupts)
  - [Usage](#usage)
  - [Features](#features)

<!-- /TOC -->
## generate-toc.ts

Automatically generates a 3-level Table of Contents (TOC) for Markdown files.

**Note:** All scripts in this directory are written in TypeScript with strict type checking. When creating new scripts, use TypeScript and ensure they compile with `npm run build:scripts`.

### Usage

The script is written in TypeScript and must be built first:

```bash
npm run build:scripts
node scripts/dist/generate-toc.js <path-to-markdown-file>
```

Or use the TypeScript source directly with a TypeScript runner (if you have one installed):

```bash
npx tsx scripts/generate-toc.ts <path-to-markdown-file>
```

### Features

- Generates TOC for H1, H2, and H3 headings
- Automatically inserts/updates TOC between `<!-- TOC -->` and `<!-- /TOC -->` markers
- Creates anchor links using slugified heading text
- Preserves existing TOC if markers are present, otherwise inserts after first H1

### Git Hook

A pre-commit hook is installed at `.git/hooks/pre-commit` that automatically generates TOCs for all staged `.md` files before each commit.

### Manual TOC Generation

To manually generate TOC for all markdown files:

```bash
npm run build:scripts
find docs -name "*.md" -exec node scripts/dist/generate-toc.js {} \;
```

---

## check-dns-propagation.ts

Monitors DNS propagation for a CNAME record. Polls DNS servers until the record is found or timeout is reached.

### Usage

```bash
npm run build:scripts
node scripts/dist/check-dns-propagation.js <domain> <target>
```

**Example:**
```bash
node scripts/dist/check-dns-propagation.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app
```

### Features

- Checks CNAME record propagation status
- Polls every 5 minutes (configurable)
- Maximum 48 attempts (4 hours) by default
- Provides real-time status updates
- Exits when propagation is complete or timeout reached

**Options:**
- `intervalSeconds`: Time between checks (default: 300 seconds / 5 minutes)
- `maxAttempts`: Maximum number of attempts (default: 48)

---

## verify-domain-setup.ts

Comprehensive verification script that checks all aspects of custom domain configuration for Shuttle deployments.

### Usage

```bash
npm run build:scripts
node scripts/dist/verify-domain-setup.js <domain> <shuttle-url>
```

**Example:**
```bash
node scripts/dist/verify-domain-setup.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app
```

### Features

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

