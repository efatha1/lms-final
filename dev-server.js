import { createServer } from 'vite';
import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function startDevServer() {
  // Start Vite dev server
  const vite = await createServer({
    configFile: './vite.config.ts',
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
  });

  await vite.listen();
  console.log('Vite dev server started at http://localhost:5173');

  // Start backend server
  const backend = spawn('node', ['server/index.js'], {
    stdio: 'inherit',
    shell: true,
  });

  backend.on('error', (err) => {
    console.error('Failed to start backend server:', err);
  });

  process.on('SIGINT', () => {
    vite.close();
    backend.kill('SIGINT');
    process.exit();
  });
}

startDevServer().catch((err) => {
  console.error('Error starting development servers:', err);
  process.exit(1);
});