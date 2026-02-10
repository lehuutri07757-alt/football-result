#!/usr/bin/env node

const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;

console.log(`🎯 Dashboard: http://localhost:${PORT}`);

// Start Next.js dev server
const nextDev = spawn('next', ['dev', '-p', PORT], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
});

nextDev.on('close', (code) => {
  process.exit(code);
});

process.on('SIGINT', () => {
  nextDev.kill('SIGINT');
  process.exit(0);
});
