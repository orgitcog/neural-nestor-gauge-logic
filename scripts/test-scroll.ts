/**
 * Test script for verifying step scroll behavior
 * 
 * This script uses Puppeteer to automate browser testing of the scroll
 * functionality when navigating between steps in the examples.
 * 
 * Usage:
 *   npm run test:scroll
 *   npm run test:scroll -- --example=mlp --step=3
 *   npm run test:scroll -- --example=gnn --all-steps
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

interface TestOptions {
  example?: string;
  step?: number;
  allSteps?: boolean;
  headless?: boolean;
  port?: number;
}

interface TestResult {
  stepIndex: number;
  stepName: string;
  expectedTop: number;
  actualTop: number;
  error: number;
  success: boolean;
}

const HEADER_HEIGHT = 140;

async function startDevServer(port: number): Promise<{ process: any; url: string }> {
  return new Promise((resolve, reject) => {
    const vite = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
      cwd: projectRoot,
      stdio: 'pipe',
      shell: true,
    });

    let output = '';
    vite.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Local:') || output.includes('localhost')) {
        const match = output.match(/Local:\s*(https?:\/\/[^\s]+)/);
        const url = match?.[1] ?? `http://localhost:${port}`;
        resolve({ process: vite, url });
      }
    });

    vite.stderr.on('data', (data) => {
      console.error(`Vite error: ${data.toString()}`);
    });

    vite.on('error', reject);

    // Timeout after 30 seconds
    setTimeout(() => {
      vite.kill();
      reject(new Error('Dev server startup timeout'));
    }, 30000);
  });
}

async function waitForTransition(_page: Page, timeout = 500): Promise<void> {
  // Simply wait for the transition duration + buffer
  // CSS transition is 250ms, so we wait a bit longer to ensure completion
  await new Promise(resolve => setTimeout(resolve, timeout));
}

async function testStepScroll(
  page: Page,
  stepIndex: number
): Promise<TestResult> {
  // Click the next/previous button to navigate to this step
  // Note: UI displays 1-based step numbers (1, 2, 3...), but stepIndex is 0-based (0, 1, 2...)
  const currentStep = await page.evaluate(() => {
    const span = document.getElementById('current-step');
    // Convert 1-based UI value to 0-based index
    return span ? parseInt(span.textContent || '0') - 1 : 0;
  });

  if (currentStep !== stepIndex) {
    // Navigate to the step
    if (stepIndex > currentStep) {
      // Click next button
      for (let i = currentStep; i < stepIndex; i++) {
        await page.click('#next-step');
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait for click and initial response
        await waitForTransition(page, 500); // Wait for transitions (250ms + buffer)
        await new Promise(resolve => setTimeout(resolve, 800)); // Wait for smooth scroll
      }
    } else {
      // Click previous button
      for (let i = currentStep; i > stepIndex; i--) {
        await page.click('#prev-step');
        await new Promise(resolve => setTimeout(resolve, 200));
        await waitForTransition(page, 500);
        await new Promise(resolve => setTimeout(resolve, 800)); // Wait for smooth scroll
      }
    }
  }

  // Wait for scroll to complete - smooth scroll takes time
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for smooth scroll to complete

  // Measure scroll position
  const result = await page.evaluate(
    (index, headerHeight) => {
      const step = document.querySelector(`.step[data-step="${index}"]`) as HTMLElement;
      const mainContent = document.getElementById('main-content') as HTMLElement;
      if (!step || !mainContent) {
        return {
          stepIndex: index,
          stepName: 'Unknown',
          expectedTop: headerHeight,
          actualTop: 0,
          error: headerHeight,
          success: false,
        };
      }

      const stepRect = step.getBoundingClientRect();
      const mainContentRect = mainContent.getBoundingClientRect();
      const actualTop = stepRect.top - mainContentRect.top;
      const error = Math.abs(actualTop - headerHeight);

      return {
        stepIndex: index,
        stepName: step.querySelector('h3')?.textContent || 'Unknown',
        expectedTop: headerHeight,
        actualTop: Math.round(actualTop * 10) / 10,
        error: Math.round(error * 10) / 10,
        success: error < 10,
      };
    },
    stepIndex,
    HEADER_HEIGHT
  );

  return result;
}

async function runTests(
  browser: Browser,
  url: string,
  options: TestOptions
): Promise<TestResult[]> {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log(`\n🌐 Opening ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Wait for page to be ready
  await page.waitForSelector('#main-content', { timeout: 10000 });

  // Determine which example to test
  const exampleId = options.example || 'mlp';
  
  // Find the example button in the sidebar by data-example attribute
  const exampleButton = await page.$(`button.nav-button[data-example="${exampleId}"]`);
  
  if (!exampleButton) {
    throw new Error(
      `Example "${exampleId}" not found. Available examples: ` +
      `logic, mlp, mlp-batch, transformer, multihead, gnn, kernel, bayesian, hmm`
    );
  }

  console.log(`\n📋 Loading example: ${exampleId}...`);
  await exampleButton.click();
  await new Promise(resolve => setTimeout(resolve, 500)); // Wait for example to load
  await page.waitForSelector('.step', { timeout: 5000 });

  // Get total number of steps
  const totalSteps = await page.evaluate(() => {
    const steps = document.querySelectorAll('.step');
    return steps.length;
  });

  console.log(`\n✅ Found ${totalSteps} steps`);

  const results: TestResult[] = [];

  if (options.allSteps) {
    // Test all steps
    console.log(`\n🧪 Testing all ${totalSteps} steps...\n`);
    for (let i = 0; i < totalSteps; i++) {
      console.log(`  Testing step ${i}...`);
      const result = await testStepScroll(page, i);
      results.push(result);
      console.log(
        `    ${result.success ? '✅' : '❌'} Step ${i} (${result.stepName}): ` +
        `Expected: ${result.expectedTop}px, Actual: ${result.actualTop}px, ` +
        `Error: ${result.error}px`
      );
    }
  } else if (options.step !== undefined) {
    // Test specific step
    const stepIndex = options.step;
    if (stepIndex < 0 || stepIndex >= totalSteps) {
      throw new Error(`Step ${stepIndex} is out of range (0-${totalSteps - 1})`);
    }
    console.log(`\n🧪 Testing step ${stepIndex}...\n`);
    const result = await testStepScroll(page, stepIndex);
    results.push(result);
    console.log(
      `${result.success ? '✅' : '❌'} Step ${stepIndex} (${result.stepName}): ` +
      `Expected: ${result.expectedTop}px, Actual: ${result.actualTop}px, ` +
      `Error: ${result.error}px`
    );
  } else {
    // Test first few steps by default
    const stepsToTest = Math.min(5, totalSteps);
    console.log(`\n🧪 Testing first ${stepsToTest} steps...\n`);
    for (let i = 0; i < stepsToTest; i++) {
      console.log(`  Testing step ${i}...`);
      const result = await testStepScroll(page, i);
      results.push(result);
      console.log(
        `    ${result.success ? '✅' : '❌'} Step ${i} (${result.stepName}): ` +
        `Expected: ${result.expectedTop}px, Actual: ${result.actualTop}px, ` +
        `Error: ${result.error}px`
      );
    }
  }

  await page.close();
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const options: TestOptions = {
    headless: true, // Default to headless mode
    port: 5173,
  };

  // Parse command line arguments
  for (const arg of args) {
    if (arg.startsWith('--example=')) {
      const exampleValue = arg.split('=')[1];
      if (exampleValue) {
        options.example = exampleValue;
      }
    } else if (arg.startsWith('--step=')) {
      const stepValue = arg.split('=')[1];
      if (stepValue) {
        options.step = parseInt(stepValue, 10);
      }
    } else if (arg === '--all-steps') {
      options.allSteps = true;
    } else if (arg === '--headed') {
      options.headless = false;
    } else if (arg.startsWith('--port=')) {
      const portValue = arg.split('=')[1];
      if (portValue) {
        options.port = parseInt(portValue, 10);
      }
    }
  }

  console.log('🚀 Starting scroll behavior test...');
  console.log(`Options:`, options);

  let devServer: { process: any; url: string } | null = null;
  let browser: Browser | null = null;

  try {
    // Start dev server
    console.log('\n📦 Starting dev server...');
    devServer = await startDevServer(options.port!);
    console.log(`✅ Dev server running at ${devServer.url}`);

    // Launch browser in headless mode by default
    console.log('\n🌐 Launching browser (headless mode)...');
    const launchOptions: any = {
      headless: options.headless !== false ? 'new' : false, // Default to headless unless explicitly disabled
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
      ],
    };
    
    // Always try to use system Chrome (since we skipped Puppeteer's Chrome download)
    if (process.platform === 'darwin') {
      const chromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
      ];
      for (const chromePath of chromePaths) {
        try {
          const fs = await import('fs');
          if (fs.existsSync(chromePath)) {
            launchOptions.executablePath = chromePath;
            console.log(`Using system Chrome: ${chromePath}`);
            break;
          }
        } catch (e) {
          // Ignore
        }
      }
    }
    
    browser = await puppeteer.launch(launchOptions);
    console.log('✅ Browser launched (headless)');

    // Run tests
    const results = await runTests(browser, devServer.url ?? '', options);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    console.log(`Total tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\n❌ Failed tests:');
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.log(
            `  Step ${r.stepIndex} (${r.stepName}): Error ${r.error}px ` +
            `(Expected: ${r.expectedTop}px, Actual: ${r.actualTop}px)`
          );
        });
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup - ensure browser is closed properly
    if (browser) {
      try {
        const pages = await browser.pages();
        await Promise.all(pages.map(page => page.close().catch(() => {})));
        await browser.close();
        console.log('\n🧹 Browser closed');
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    if (devServer) {
      try {
        devServer.process.kill('SIGTERM');
        // Wait a bit for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!devServer.process.killed) {
          devServer.process.kill('SIGKILL');
        }
        console.log('🧹 Dev server stopped');
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

