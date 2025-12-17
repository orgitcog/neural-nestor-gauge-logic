#!/usr/bin/env node
/**
 * Generate Table of Contents for Markdown files
 * Supports 3 levels of headings (H1, H2, H3)
 */

import fs from 'fs';

interface Heading {
  readonly level: 1 | 2 | 3;
  readonly text: string;
  readonly line: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\//g, '-')        // Convert slashes to hyphens first (for CI/CD, etc.)
    .replace(/[^\w\s-]/g, '')  // Remove other special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-')       // Replace multiple hyphens with single
    .trim();
}

function generateTOC(content: string): string {
  const lines = content.split('\n');
  const toc: string[] = [];
  const headings: Heading[] = [];
  
  // Find all headings (H1, H2, H3)
  lines.forEach((line: string, index: number): void => {
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);
    
    if (h1Match !== null && h1Match[1] !== undefined) {
      headings.push({ level: 1, text: h1Match[1].trim(), line: index });
    } else if (h2Match !== null && h2Match[1] !== undefined) {
      headings.push({ level: 2, text: h2Match[1].trim(), line: index });
    } else if (h3Match !== null && h3Match[1] !== undefined) {
      headings.push({ level: 3, text: h3Match[1].trim(), line: index });
    }
  });
  
  // Skip the first H1 (usually the title)
  // Include all subsequent H1, H2, and H3 headings in the TOC
  const relevantHeadings = headings.slice(1);
  
  // Generate TOC entries
  // H1s have no indent, H2s have 2 spaces indent, H3s have 4 spaces indent
  relevantHeadings.forEach((heading: Heading): void => {
    const indent = '  '.repeat(Math.max(0, heading.level - 1));
    const link = `#${slugify(heading.text)}`;
    toc.push(`${indent}- [${heading.text}](${link})`);
  });
  
  return toc.join('\n');
}

function insertTOC(content: string): string {
  const lines = content.split('\n');
  const tocMarker = '<!-- TOC -->';
  const tocEndMarker = '<!-- /TOC -->';
  
  // Find existing TOC markers
  let tocStartIndex = -1;
  let tocEndIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]?.trim() === tocMarker) {
      tocStartIndex = i;
    }
    if (lines[i]?.trim() === tocEndMarker) {
      tocEndIndex = i;
      break;
    }
  }
  
  // Generate new TOC
  const toc = generateTOC(content);
  const tocSection = [tocMarker, '', toc, '', tocEndMarker].join('\n');
  
  // If TOC exists, replace it
  if (tocStartIndex !== -1 && tocEndIndex !== -1) {
    const before = lines.slice(0, tocStartIndex).join('\n');
    const after = lines.slice(tocEndIndex + 1).join('\n');
    return [before, tocSection, after].join('\n');
  }
  
  // If no TOC exists, insert after first H1
  let insertIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line !== undefined && line.match(/^#\s+/) !== null) {
      insertIndex = i + 1;
      // Skip empty lines after H1
      while (insertIndex < lines.length && lines[insertIndex]?.trim() === '') {
        insertIndex++;
      }
      break;
    }
  }
  
  const before = lines.slice(0, insertIndex).join('\n');
  const after = lines.slice(insertIndex).join('\n');
  return [before, tocSection, after].join('\n');
}

// Main execution
const filePath: string | undefined = process.argv[2];

if (filePath === undefined) {
  console.error('Usage: node generate-toc.js <markdown-file>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const updatedContent = insertTOC(content);
fs.writeFileSync(filePath, updatedContent, 'utf8');

console.log(`TOC generated for: ${filePath}`);

export { generateTOC, insertTOC };

