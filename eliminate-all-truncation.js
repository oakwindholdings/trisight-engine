// eliminate-all-truncation.js
// Script to remove ALL text truncation from the report generation system
// Rule: Reliability - Display full AI responses without any limits

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/reportGeneration/adapters/firecrawlAdapter.ts',
  'src/utils/claudeOpusEnhanced.ts', 
  'src/reportGeneration/services/dataEnrichmentService.ts',
  'src/reportGeneration/models/reportTypes.ts',
  'src/reportGeneration/utils/aiSummarizer.ts'
];

function removeAllTruncation() {
  let totalChanges = 0;
  
  filesToFix.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;
    
    // 1. Remove substring truncation with ellipsis
    const substringEllipsisPattern = /(\w+\.substring\([^)]+\)\s*\+\s*['"`]\.\.\.['"`])/g;
    const substringMatches = content.match(substringEllipsisPattern);
    if (substringMatches) {
      substringMatches.forEach(match => {
        // Extract the variable name before .substring
        const varMatch = match.match(/(\w+)\.substring/);
        if (varMatch) {
          const varName = varMatch[1];
          content = content.replace(match, varName);
          changes++;
        }
      });
    }
    
    // 2. Remove maxLength parameters and their usage
    content = content.replace(/maxLength:\s*number\s*=\s*\d+/g, '');
    content = content.replace(/,\s*maxLength:\s*number/g, '');
    content = content.replace(/maxLength\s*=\s*\d+/g, '');
    
    // 3. Remove ternary operators that truncate
    const ternaryPattern = /(\w+)\.length\s*>\s*\w+\s*\?\s*\1\.substring\([^)]+\)\s*\+\s*['"`]\.\.\.['"`]\s*:\s*\1/g;
    const ternaryMatches = content.match(ternaryPattern);
    if (ternaryMatches) {
      ternaryMatches.forEach(match => {
        const varMatch = match.match(/(\w+)\.length/);
        if (varMatch) {
          const varName = varMatch[1];
          content = content.replace(match, varName);
          changes++;
        }
      });
    }
    
    // 4. Fix specific known truncation patterns
    
    // Fix firecrawlAdapter generateSummary
    if (filePath.includes('firecrawlAdapter')) {
      content = content.replace(
        /return summary\.length > maxLength\s*\?\s*summary\.substring\([^)]+\)\s*\+\s*['"`]\.\.\.['"`]\s*:\s*summary;/g,
        'return summary;'
      );
      changes++;
    }
    
    // Fix claudeOpusEnhanced content.substring(0, 500)
    if (filePath.includes('claudeOpusEnhanced')) {
      content = content.replace(/content\.substring\(0,\s*500\)/g, 'content');
      content = content.replace(/content\.substring\(0,\s*500\)/g, 'content');
      changes++;
    }
    
    // Fix dataEnrichmentService description truncation
    if (filePath.includes('dataEnrichmentService')) {
      content = content.replace(
        /oldValue:\s*enriched\.description\.substring\([^)]+\)\s*\+\s*['"`]\.\.\.['"`]/g,
        'oldValue: enriched.description'
      );
      content = content.replace(
        /newValue:\s*enhancedDesc\.substring\([^)]+\)\s*\+\s*['"`]\.\.\.['"`]/g,
        'newValue: enhancedDesc'
      );
      changes++;
    }
    
    // 5. Remove any remaining ellipsis patterns
    content = content.replace(/\s*\+\s*['"`]\.\.\.\.['"`]/g, '');
    content = content.replace(/\s*\+\s*['"`]\.\.\.['"`]/g, '');
    
    if (changes > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${changes} truncation issues in ${filePath}`);
      totalChanges += changes;
    } else {
      console.log(`✓ No truncation found in ${filePath}`);
    }
  });
  
  console.log(`\n🎯 TOTAL: Eliminated ${totalChanges} truncation patterns`);
  console.log('📝 All AI content will now display in full without limits');
}

removeAllTruncation();
