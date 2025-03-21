import { spawn } from 'child_process';
import { createServer } from 'vite';

// Start the backend server
const backendServer = spawn('node', ['server/index.js'], { stdio: 'inherit' });

// Start the Vite dev server
const viteServer = await createServer({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    },
  },
});

await viteServer.listen();

console.log('Development server running with backend proxy');

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down development servers...');
  backendServer.kill();
  viteServer.close();
  process.exit();
});