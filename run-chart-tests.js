// Simple test runner to debug issues
const { spawn } = require('child_process');

console.log('Running chart pattern tests...');

const test = spawn('npm', ['test', '--', '--testNamePattern=Pattern Rendering', '--verbose'], {
  shell: true,
  stdio: 'inherit',
  env: { ...process.env, CI: 'true' }
});

test.on('error', (error) => {
  console.error('Failed to start test process:', error);
});

test.on('close', (code) => {
  console.log(`Test process exited with code ${code}`);
  process.exit(code);
});
