#!/usr/bin/env node
/**
 * DNS Propagation Checker
 * 
 * Checks if a CNAME record has propagated for a given domain.
 * Polls DNS servers until the record is found or timeout is reached.
 * 
 * Usage:
 *   npm run build:scripts
 *   node scripts/dist/check-dns-propagation.js <domain> <target>
 * 
 * Example:
 *   node scripts/dist/check-dns-propagation.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app
 */

import { execSync } from 'child_process';
import * as process from 'process';

interface DNSResult {
  domain: string;
  target: string;
  found: boolean;
  actualValue?: string;
  error?: string;
}

function checkDNSCNAME(domain: string): DNSResult {
  try {
    const output = execSync(`dig CNAME +short ${domain}`, { encoding: 'utf-8' });
    const result = output.trim();
    
    if (result) {
      // Remove trailing dot if present
      const cname = result.replace(/\.$/, '');
      return {
        domain,
        target: '', // Will be set by caller
        found: true,
        actualValue: cname,
      };
    }
    
    return {
      domain,
      target: '',
      found: false,
    };
  } catch (error) {
    return {
      domain,
      target: '',
      found: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function checkDNSPropagation(
  domain: string,
  expectedTarget: string,
  options: { intervalSeconds?: number; maxAttempts?: number } = {}
): Promise<boolean> {
  const intervalSeconds = options.intervalSeconds || 300; // 5 minutes default
  const maxAttempts = options.maxAttempts || 48; // 4 hours default (48 * 5 min)

  return new Promise((resolve) => {
    let attempts = 0;

    const check = () => {
      attempts++;
      const result = checkDNSCNAME(domain);

      if (result.found && result.actualValue === expectedTarget) {
        console.log(`✅ DNS propagation complete!`);
        console.log(`   ${domain} → ${result.actualValue}`);
        resolve(true);
        return;
      }

      if (result.found && result.actualValue !== expectedTarget) {
        console.log(`⚠️  CNAME found but points to different target:`);
        console.log(`   Expected: ${expectedTarget}`);
        console.log(`   Actual:   ${result.actualValue}`);
        console.log(`   This may indicate a misconfiguration.`);
        resolve(false);
        return;
      }

      if (attempts >= maxAttempts) {
        console.log(`❌ Timeout: DNS propagation not complete after ${maxAttempts} attempts (${maxAttempts * intervalSeconds / 60} minutes)`);
        console.log(`   Check DNS configuration manually.`);
        resolve(false);
        return;
      }

      console.log(`⏳ Attempt ${attempts}/${maxAttempts}: DNS not yet propagated...`);
      console.log(`   Waiting ${intervalSeconds} seconds before next check...`);
      
      setTimeout(check, intervalSeconds * 1000);
    };

    check();
  });
}

function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('Usage: node check-dns-propagation.js <domain> <target>');
    console.error('Example: node check-dns-propagation.js tensor-logic.samkirk.com tensor-logic-noo5.shuttle.app');
    process.exit(1);
  }

  const [domain, target] = args;
  
  if (!domain || !target) {
    console.error('Error: Both domain and target are required');
    process.exit(1);
  }
  
  console.log(`🔍 Checking DNS propagation for: ${domain}`);
  console.log(`   Expected CNAME target: ${target}`);
  console.log('');

  // Initial check
  const initialResult = checkDNSCNAME(domain);
  
  if (initialResult.found && initialResult.actualValue === target) {
    console.log(`✅ DNS already propagated!`);
    console.log(`   ${domain} → ${initialResult.actualValue}`);
    process.exit(0);
  }

  if (initialResult.found && initialResult.actualValue !== target) {
    console.log(`⚠️  CNAME found but points to different target:`);
    console.log(`   Expected: ${target}`);
    console.log(`   Actual:   ${initialResult.actualValue}`);
    console.log(`   This may indicate a misconfiguration.`);
    process.exit(1);
  }

  console.log(`⏳ DNS not yet propagated. Starting polling...`);
  console.log('');

  checkDNSPropagation(domain, target)
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

// ES module entry point - call main() directly since this script is meant to be executed
main();

