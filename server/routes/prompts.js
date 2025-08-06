// server/routes/prompts.js
// API endpoints for managing report generation prompts

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Default prompts storage file
const PROMPTS_FILE = path.join(__dirname, '../config/report-prompts.json');

/**
 * GET /api/prompts
 * Get all current prompts for report sections
 */
router.get('/', async (req, res) => {
  try {
    // Try to read custom prompts file
    let prompts;
    try {
      const data = await fs.readFile(PROMPTS_FILE, 'utf8');
      prompts = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist, return defaults
      const MaximalReportOrchestrator = require('../services/maximalReportOrchestrator');
      const orchestrator = new MaximalReportOrchestrator();
      prompts = orchestrator.defaultPrompts;
    }
    
    res.json({
      success: true,
      prompts,
      sections: Object.keys(prompts)
    });
  } catch (error) {
    console.error('[Prompts API] Error fetching prompts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/prompts/:section
 * Get prompt for a specific section
 */
router.get('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    
    let prompts;
    try {
      const data = await fs.readFile(PROMPTS_FILE, 'utf8');
      prompts = JSON.parse(data);
    } catch (error) {
      const MaximalReportOrchestrator = require('../services/maximalReportOrchestrator');
      const orchestrator = new MaximalReportOrchestrator();
      prompts = orchestrator.defaultPrompts;
    }
    
    if (!prompts[section]) {
      return res.status(404).json({
        success: false,
        error: `Section '${section}' not found`
      });
    }
    
    res.json({
      success: true,
      section,
      prompt: prompts[section]
    });
  } catch (error) {
    console.error('[Prompts API] Error fetching section prompt:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/prompts
 * Update all prompts
 */
router.post('/', async (req, res) => {
  try {
    const { prompts } = req.body;
    
    if (!prompts || typeof prompts !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid prompts object'
      });
    }
    
    // Ensure config directory exists
    const configDir = path.dirname(PROMPTS_FILE);
    await fs.mkdir(configDir, { recursive: true });
    
    // Save prompts to file
    await fs.writeFile(PROMPTS_FILE, JSON.stringify(prompts, null, 2));
    
    res.json({
      success: true,
      message: 'Prompts updated successfully',
      sections: Object.keys(prompts)
    });
  } catch (error) {
    console.error('[Prompts API] Error updating prompts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/prompts/:section
 * Update a specific section prompt
 */
router.put('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    const { prompt } = req.body;
    
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid prompt string'
      });
    }
    
    // Read existing prompts
    let prompts;
    try {
      const data = await fs.readFile(PROMPTS_FILE, 'utf8');
      prompts = JSON.parse(data);
    } catch (error) {
      const MaximalReportOrchestrator = require('../services/maximalReportOrchestrator');
      const orchestrator = new MaximalReportOrchestrator();
      prompts = { ...orchestrator.defaultPrompts };
    }
    
    // Update specific section
    prompts[section] = prompt;
    
    // Ensure config directory exists
    const configDir = path.dirname(PROMPTS_FILE);
    await fs.mkdir(configDir, { recursive: true });
    
    // Save updated prompts
    await fs.writeFile(PROMPTS_FILE, JSON.stringify(prompts, null, 2));
    
    res.json({
      success: true,
      message: `Prompt for section '${section}' updated successfully`,
      section,
      prompt
    });
  } catch (error) {
    console.error('[Prompts API] Error updating section prompt:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/prompts/:section
 * Reset a section prompt to default
 */
router.delete('/:section', async (req, res) => {
  try {
    const { section } = req.params;
    
    // Get default prompts
    const MaximalReportOrchestrator = require('../services/maximalReportOrchestrator');
    const orchestrator = new MaximalReportOrchestrator();
    const defaultPrompts = orchestrator.defaultPrompts;
    
    if (!defaultPrompts[section]) {
      return res.status(404).json({
        success: false,
        error: `Section '${section}' not found`
      });
    }
    
    // Read existing prompts
    let prompts;
    try {
      const data = await fs.readFile(PROMPTS_FILE, 'utf8');
      prompts = JSON.parse(data);
    } catch (error) {
      prompts = { ...defaultPrompts };
    }
    
    // Reset to default
    prompts[section] = defaultPrompts[section];
    
    // Save updated prompts
    await fs.writeFile(PROMPTS_FILE, JSON.stringify(prompts, null, 2));
    
    res.json({
      success: true,
      message: `Prompt for section '${section}' reset to default`,
      section,
      prompt: defaultPrompts[section]
    });
  } catch (error) {
    console.error('[Prompts API] Error resetting section prompt:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;