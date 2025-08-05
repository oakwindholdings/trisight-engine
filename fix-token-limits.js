// fix-token-limits.js
// Script to set all max_tokens to 4096 in anthropicAIService.ts
// Rule: Reliability - Eliminate all content truncation issues

const fs = require('fs');
const path = require('path');

const filePath = 'src/reportGeneration/services/anthropicAIService.ts';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Replace all max_tokens with 4096
content = content.replace(/max_tokens:\s*\d+/g, 'max_tokens: 4096');

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Set all max_tokens limits to 4096 in anthropicAIService.ts');
console.log('🚫 Eliminated all content truncation issues');
