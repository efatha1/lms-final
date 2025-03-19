const express = require('express');
const { createServer: createViteServer } = require('vite');
const { spawn } = require('child_process');
const path = require('path');

async function createServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Create Vite server in middleware mode for hot-reloading
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: path.resolve(__dirname),
  });

  // Use Vite's connect instance as middleware
  app.use(vite.middlewares);

  // Start the backend server as a child process
  const serverProcess = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, 'server'),
    stdio: 'inherit',
    env: { ...process.env, PORT: 3000 }
  });

  // Handle server process exit
  serverProcess.on('exit', (code) => {
    console.log(`Backend server exited with code ${code}`);
    process.exit(code);
  });

  // Handle process termination (Ctrl+C)
  process.on('SIGINT', () => {
    serverProcess.kill('SIGINT');
    vite.close();
    process.exit(0);
  });

  // Start the development server
  app.listen(PORT, () => {
    console.log(`Development server running at http://localhost:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Error starting development server:', err);
  process.exit(1);
});