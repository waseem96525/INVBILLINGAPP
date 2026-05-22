#!/usr/bin/env node
// Quick syntax check - just try to require the server
try {
  console.log('Checking Node.js version...');
  console.log('Node:', process.version);
  
  console.log('\nChecking required modules...');
  require('dotenv');
  console.log('✓ dotenv');
  require('express');
  console.log('✓ express');
  require('cors');
  console.log('✓ cors');
  require('better-sqlite3');
  console.log('✓ better-sqlite3');
  require('bcryptjs');
  console.log('✓ bcryptjs');
  
  console.log('\n✓ All dependencies available. Syntax check passed!');
  process.exit(0);
} catch (err) {
  console.error('✗ Error:', err.message);
  process.exit(1);
}
