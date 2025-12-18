/**
 * Tensor Logic Demo - Interactive Educational Demo
 * 
 * Based on Pedro Domingos' paper "Tensor Logic: The Language of AI"
 * 
 * This demo shows how Tensor Logic unifies neural and symbolic AI
 * by expressing both as Einstein summation over tensors.
 */

import {
  runLogicProgramExample,
  runMLPExample,
  runFullXORDemo,
  runTransformerExample,
  runMultiHeadAttentionExample,
  runKernelExample,
  runGraphicalModelExample,
  runHMMExample,
  runGNNExample,
} from './tensor-logic';

interface Example {
  id: string;
  name: string;
  category: 'symbolic' | 'neural' | 'probabilistic' | 'hybrid';
  run: () => {
    title: string;
    description: string;
    code: string;
    steps: {
      name: string;
      explanation: string;
      tensorString: string;
    }[];
  };
}

const examples: Example[] = [
  {
    id: 'logic',
    name: 'Logic Programming',
    category: 'symbolic',
    run: runLogicProgramExample,
  },
  {
    id: 'mlp',
    name: 'Multi-Layer Perceptron',
    category: 'neural',
    run: runMLPExample,
  },
  {
    id: 'mlp-batch',
    name: 'MLP Batch Processing (XOR)',
    category: 'neural',
    run: runFullXORDemo,
  },
  {
    id: 'transformer',
    name: 'Transformer (Self-Attention)',
    category: 'neural',
    run: runTransformerExample,
  },
  {
    id: 'multihead',
    name: 'Multi-Head Attention',
    category: 'neural',
    run: runMultiHeadAttentionExample,
  },
  {
    id: 'gnn',
    name: 'Graph Neural Network',
    category: 'neural',
    run: runGNNExample,
  },
  {
    id: 'kernel',
    name: 'Kernel Machines (SVM)',
    category: 'hybrid',
    run: runKernelExample,
  },
  {
    id: 'bayesian',
    name: 'Bayesian Network',
    category: 'probabilistic',
    run: runGraphicalModelExample,
  },
  {
    id: 'hmm',
    name: 'Hidden Markov Model',
    category: 'probabilistic',
    run: runHMMExample,
  },
];

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function renderExample(example: Example): void {
  const result = example.run();
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  const categoryColors: Record<string, string> = {
    symbolic: '#ff6b6b',
    neural: '#4ecdc4',
    probabilistic: '#ffe66d',
    hybrid: '#95e1d3',
  };

  const totalSteps = result.steps.length + 1; // +1 for Overview step

  mainContent.innerHTML = `
    <article class="example-container">
      <header class="example-header" style="display: none;">
        <span class="category-badge" style="background: ${categoryColors[example.category]}">${example.category}</span>
        <h1>${escapeHtml(result.title)}</h1>
      </header>
      
      <section class="steps-section">
        <div class="steps-header">
          <div class="steps-header-top">
            <span class="category-badge" style="background: ${categoryColors[example.category]}">${example.category}</span>
            <h1 class="example-title-fixed">${escapeHtml(result.title)}</h1>
          </div>
          <div class="steps-header-bottom">
            <h2>Step-by-Step Execution</h2>
            <div class="step-controls">
              <button class="step-nav-btn" id="prev-step" disabled>← Previous</button>
              <span class="step-counter">Step <span id="current-step">0</span> of ${totalSteps}</span>
              <button class="step-nav-btn" id="next-step" ${totalSteps <= 1 ? 'disabled' : ''}>Next →</button>
            </div>
          </div>
        </div>
        <div class="steps-container">
          <!-- Step 0: Overview -->
          <div class="step active" data-step="0">
            <div class="step-header" data-step-toggle="0">
              <span class="step-number">0</span>
              <h3>Overview</h3>
              <button class="step-toggle" aria-label="Toggle step 0">
                <span class="toggle-icon">▼</span>
              </button>
            </div>
            <div class="step-content expanded">
              <div class="step-explanation">
                <pre>${escapeHtml(result.description)}</pre>
              </div>
            </div>
          </div>
          
          ${result.steps
            .map(
              (step, i) => `
            <div class="step" data-step="${i + 1}">
              <div class="step-header" data-step-toggle="${i + 1}">
                <span class="step-number">${i + 1}</span>
                <h3>${escapeHtml(step.name)}</h3>
                <button class="step-toggle" aria-label="Toggle step ${i + 1}">
                  <span class="toggle-icon">▶</span>
                </button>
              </div>
              <div class="step-content">
                <div class="step-explanation">
                  <pre>${escapeHtml(step.explanation)}</pre>
                </div>
                <div class="step-tensor">
                  <h4>Tensor Output</h4>
                  <pre class="tensor-output">${escapeHtml(step.tensorString)}</pre>
                </div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </section>
    </article>
  `;

  // Add interactive functionality
  setupStepInteractivity(totalSteps);
  
  // Scroll to the top of the example container so user sees the title and overview
  const exampleContainer = mainContent.querySelector('.example-container');
  if (exampleContainer) {
    exampleContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

let currentStepIndex = 0;
let keyboardHandler: ((e: KeyboardEvent) => void) | null = null;

function setupStepInteractivity(totalSteps: number): void {
  currentStepIndex = 0;
  
  // Remove previous keyboard listener if it exists
  if (keyboardHandler) {
    document.removeEventListener('keydown', keyboardHandler);
    keyboardHandler = null;
  }
  
  // Step toggle functionality
  const stepHeaders = document.querySelectorAll('.step-header[data-step-toggle]');
  stepHeaders.forEach((header) => {
    header.addEventListener('click', () => {
      const stepIndex = parseInt(header.getAttribute('data-step-toggle') || '0');
      const step = document.querySelector(`.step[data-step="${stepIndex}"]`);
      const content = step?.querySelector('.step-content');
      const toggleIcon = header.querySelector('.toggle-icon');
      
      if (step && content) {
        const isExpanded = content.classList.contains('expanded');
        if (isExpanded) {
          content.classList.remove('expanded');
          if (toggleIcon) toggleIcon.textContent = '▶';
        } else {
          content.classList.add('expanded');
          if (toggleIcon) toggleIcon.textContent = '▼';
        }
      }
    });
  });

  // Step navigation
  const prevBtn = document.getElementById('prev-step') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('next-step') as HTMLButtonElement | null;
  const currentStepSpan = document.getElementById('current-step');

  function updateStepNavigation() {
    if (prevBtn) prevBtn.disabled = currentStepIndex === 0;
    if (nextBtn) nextBtn.disabled = currentStepIndex >= totalSteps - 1;
    if (currentStepSpan) currentStepSpan.textContent = String(currentStepIndex);

    // Update active step
    document.querySelectorAll('.step').forEach((step) => {
      const stepIndex = parseInt(step.getAttribute('data-step') || '0');
      if (stepIndex === currentStepIndex) {
        step.classList.add('active');
        const content = step.querySelector('.step-content');
        if (content) {
          content.classList.add('expanded');
          const toggleIcon = step.querySelector('.toggle-icon');
          if (toggleIcon) toggleIcon.textContent = '▼';
        }
        // Scroll to active step - position at top of scrollable area (just below fixed header)
        const headerHeight = 140; // Match padding-top in CSS (title + controls)
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          const stepElement = step;
          
          // Function to calculate and perform scroll
          const performScroll = () => {
            if (!stepElement || !stepElement.classList.contains('active')) {
              return;
            }
            
            const stepsContainer = stepElement.closest('.steps-container');
            if (!stepsContainer) {
              return;
            }
            
            // Get current positions after all layout changes
            const stepRect = stepElement.getBoundingClientRect();
            const mainContentRect = mainContent.getBoundingClientRect();
            
            // Calculate scroll position: step's viewport-relative position converted to scroll coordinates
            // stepRect.top is relative to viewport, mainContentRect.top is relative to viewport
            // mainContent.scrollTop is the current scroll position
            // We want: step's top edge at headerHeight from viewport top
            const targetScroll = Math.max(0, mainContent.scrollTop + stepRect.top - mainContentRect.top - headerHeight);
            
            mainContent.scrollTo({
              top: targetScroll,
              behavior: 'smooth'
            });
          };
          
          // Always scroll, even if already on the step (to ensure correct position)
          // Wait for all step transitions to complete (250ms transition + buffer for all steps)
          // We need to wait for both the expanding step AND any collapsing steps
          const transitionDuration = 250; // From CSS --transition-normal
          const waitTime = transitionDuration + 150; // Extra buffer for multiple steps
          
          setTimeout(performScroll, waitTime);
        }
      } else {
        step.classList.remove('active');
        // Bug fix: Remove expanded class and update icon for inactive steps
        const content = step.querySelector('.step-content');
        if (content) {
          content.classList.remove('expanded');
          const toggleIcon = step.querySelector('.toggle-icon');
          if (toggleIcon) toggleIcon.textContent = '▶';
        }
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStepIndex > 0) {
        currentStepIndex--;
        updateStepNavigation();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentStepIndex < totalSteps - 1) {
        currentStepIndex++;
        updateStepNavigation();
      }
    });
  }

  // Keyboard navigation - store handler reference for cleanup
  keyboardHandler = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentStepIndex > 0) {
      currentStepIndex--;
      updateStepNavigation();
    } else if (e.key === 'ArrowRight' && currentStepIndex < totalSteps - 1) {
      currentStepIndex++;
      updateStepNavigation();
    }
  };
  document.addEventListener('keydown', keyboardHandler);

  // Initialize
  updateStepNavigation();
}

function renderNav(): void {
  const nav = document.getElementById('example-nav');
  if (!nav) return;

  const categories = ['symbolic', 'neural', 'probabilistic', 'hybrid'];
  const categoryNames: Record<string, string> = {
    symbolic: 'Symbolic AI',
    neural: 'Neural Networks',
    probabilistic: 'Probabilistic Models',
    hybrid: 'Hybrid Methods',
  };

  nav.innerHTML = categories
    .map((category) => {
      const categoryExamples = examples.filter((e) => e.category === category);
      if (categoryExamples.length === 0) return '';

      return `
      <div class="nav-category">
        <h3>${categoryNames[category]}</h3>
        <ul>
          ${categoryExamples
            .map(
              (example) => `
            <li>
              <button class="nav-button" data-example="${example.id}">
                ${escapeHtml(example.name)}
              </button>
            </li>
          `
            )
            .join('')}
        </ul>
      </div>
    `;
    })
    .join('');

  // Add click handlers
  nav.querySelectorAll('.nav-button').forEach((button) => {
    button.addEventListener('click', () => {
      const exampleId = button.getAttribute('data-example');
      const example = examples.find((e) => e.id === exampleId);
      if (example) {
        // Update active state
        nav.querySelectorAll('.nav-button').forEach((b) => b.classList.remove('active'));
        button.classList.add('active');
        renderExample(example);
      }
    });
  });
}

/**
 * Test function to verify scroll behavior
 * Call this from browser console: window.testStepScroll(stepIndex)
 */
(window as any).testStepScroll = (stepIndex: number) => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('main-content not found');
    return;
  }
  
  const step = document.querySelector(`.step[data-step="${stepIndex}"]`) as HTMLElement;
  if (!step) {
    console.error(`Step ${stepIndex} not found`);
    return;
  }
  
  const headerHeight = 140;
  const stepsContainer = step.closest('.steps-container');
  if (!stepsContainer) {
    console.error('steps-container not found');
    return;
  }
  
  // Force step to be active and expanded
  step.classList.add('active');
  const content = step.querySelector('.step-content');
  if (content) {
    content.classList.add('expanded');
  }
  
  // Wait for layout
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const stepRect = step.getBoundingClientRect();
      const mainContentRect = mainContent.getBoundingClientRect();
      const containerRect = stepsContainer.getBoundingClientRect();
      
      const stepOffsetFromContainer = stepRect.top - containerRect.top;
      const containerOffsetFromMain = containerRect.top - mainContentRect.top;
      const stepAbsoluteTop = mainContent.scrollTop + containerOffsetFromMain + stepOffsetFromContainer;
      const targetScroll = Math.max(0, stepAbsoluteTop - headerHeight);
      
      console.log('Test scroll calculation:', {
        stepIndex,
        stepAbsoluteTop: stepAbsoluteTop.toFixed(1),
        currentScrollTop: mainContent.scrollTop.toFixed(1),
        targetScroll: targetScroll.toFixed(1),
        stepRectTop: stepRect.top.toFixed(1),
        headerHeight
      });
      
      mainContent.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
      
      // Verify after scroll
      setTimeout(() => {
        const newStepRect = step.getBoundingClientRect();
        const newMainContentRect = mainContent.getBoundingClientRect();
        const actualTop = newStepRect.top - newMainContentRect.top;
        const error = Math.abs(actualTop - headerHeight);
        console.log('Scroll result:', {
          expectedTop: headerHeight,
          actualTop: actualTop.toFixed(1),
          error: error.toFixed(1) + 'px',
          success: error < 10
        });
      }, 600);
    });
  });
};

function renderIntro(): void {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <article class="intro-container">
      <header class="intro-header">
        <h1>Tensor Logic Examples</h1>
        <p class="subtitle">The Language of AI</p>
        <p class="author">Based on <a href="https://arxiv.org/pdf/2510.12269" target="_blank" rel="noopener">Tensor Logic: The Language of AI</a> by Prof. Emeritus Pedro Domingos (University of Washington)</p>
        <p class="author">And inspired by Dr. Tim Scarfe's 2-minute demo on the interview of Prof. Domingos in Machine Learning Street Talk's YouTube channel: <a href="https://youtu.be/4APMGvicmxY?si=T0ic6RgZ-epTPBMt&t=1070" target="_blank" rel="noopener">Tensor Logic "Unifies" AI Paradigms - Pedro Domingos</a></p>
      </header>
      
      <section class="intro-section">
        <h2>What is Tensor Logic?</h2>
        <p>
          Tensor Logic is a programming paradigm that <strong>unifies neural and symbolic AI</strong> 
          at a fundamental level. The key insight is that logical rules and Einstein summation 
          are essentially the same operation.
        </p>
      </section>
      
      <section class="intro-section">
        <h2>The Core Insight</h2>
        <div class="comparison">
          <div class="comparison-item">
            <h3>Logic Programming</h3>
            <pre class="code-block">Ancestor(x,z) ← Ancestor(x,y), Parent(y,z)</pre>
            <p>JOIN on y, PROJECT onto (x,z)</p>
          </div>
          <div class="comparison-arrow">≡</div>
          <div class="comparison-item">
            <h3>Tensor Algebra</h3>
            <pre class="code-block">Ancestor[x,z] = Σ<sub>y</sub> Ancestor[x,y] · Parent[y,z]</pre>
            <p>Einstein summation: <code>"xy,yz→xz"</code></p>
          </div>
        </div>
        <p class="insight-note">
          Both operations sum over a shared index (y) and keep the remaining indices (x,z).
          The only difference is the atomic data type: Boolean (0/1) for logic, real numbers for neural nets.
        </p>
      </section>
      
      <section class="intro-section">
        <h2>What This Unifies</h2>
        <div class="unification-grid">
          <div class="unification-item symbolic">
            <h3>Symbolic AI</h3>
            <ul>
              <li>Logic Programming (Datalog, Prolog)</li>
              <li>Theorem Proving</li>
              <li>Knowledge Graphs</li>
              <li>Rule-based Systems</li>
            </ul>
          </div>
          <div class="unification-item neural">
            <h3>Neural Networks</h3>
            <ul>
              <li>Multi-Layer Perceptrons</li>
              <li>Convolutional Networks</li>
              <li>Transformers (GPT, BERT)</li>
              <li>Attention Mechanisms</li>
            </ul>
          </div>
          <div class="unification-item probabilistic">
            <h3>Probabilistic AI</h3>
            <ul>
              <li>Bayesian Networks</li>
              <li>Markov Random Fields</li>
              <li>Hidden Markov Models</li>
              <li>Probabilistic Programs</li>
            </ul>
          </div>
          <div class="unification-item hybrid">
            <h3>Hybrid Methods</h3>
            <ul>
              <li>Kernel Machines (SVM)</li>
              <li>Graph Neural Networks</li>
              <li>Embedding-based Reasoning</li>
              <li>Markov Logic Networks</li>
            </ul>
          </div>
        </div>
      </section>
      
      <section class="intro-section">
        <h2>Why Does This Matter?</h2>
        <ul class="benefits-list">
          <li>
            <strong>Unified Language:</strong> Express neural nets, logic programs, and probabilistic models 
            in the same notation
          </li>
          <li>
            <strong>Sound Reasoning:</strong> At temperature T=0, embedding-based reasoning becomes 
            exact deduction—no hallucinations
          </li>
          <li>
            <strong>Learnable Logic:</strong> Make logical programs differentiable and trainable with 
            gradient descent
          </li>
          <li>
            <strong>Transparent AI:</strong> Extract interpretable rules from neural representations
          </li>
        </ul>
      </section>
      
      <section class="intro-section">
        <h2>Explore the Examples</h2>
        <p>
          Select an example from the sidebar to see how different AI paradigms are expressed in Tensor Logic.
          Each example shows the mathematical correspondence and walks through the computation step-by-step.
        </p>
      </section>
    </article>
  `;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  renderIntro();
  
  // Display build version
  const buildVersionEl = document.getElementById('build-version');
  if (buildVersionEl) {
    // In dev mode, calculate timestamp at runtime; in production, use build-time value
    let buildTime: string;
    if (import.meta.env.DEV) {
      // Dev mode: calculate current timestamp on each page load
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      
      const parts = formatter.formatToParts(now);
      // Use nullish coalescing (??) instead of logical OR (||) to ensure we never get "undefined" in template literals
      // The ?? operator only checks for null/undefined, not other falsy values like empty strings
      const year = parts.find(p => p.type === 'year')?.value ?? '';
      const month = parts.find(p => p.type === 'month')?.value ?? '';
      const day = parts.find(p => p.type === 'day')?.value ?? '';
      const hours = parts.find(p => p.type === 'hour')?.value ?? '';
      const minutes = parts.find(p => p.type === 'minute')?.value ?? '';
      
      buildTime = `${year}-${month}-${day}_${hours}:${minutes}`;
    } else {
      // Production: use build-time timestamp
      buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'unknown';
    }
    buildVersionEl.textContent = buildTime;
  }
});


