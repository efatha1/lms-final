import express from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  // Pass a different port for the backend to listen on internally
  const BACKEND_PORT = 3001;
  const serverProcess = spawn('node', ['index.js'], {
    cwd: path.join(__dirname, 'server'),
    stdio: 'inherit',
    env: { ...process.env, PORT: BACKEND_PORT }
  });

  // Proxy API requests to the backend server
  app.use('/api', (req, res) => {
    const proxyUrl = `http://localhost:${BACKEND_PORT}${req.url}`;
    fetch(proxyUrl, {
      method: req.method,
      headers: req.headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? req : undefined,
    }).then(async (response) => {
      // Copy status and headers
      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      
      // Stream the response body
      const body = await response.text();
      res.send(body);
    }).catch(error => {
      console.error('Proxy error:', error);
      res.status(500).send('Proxy error');
    });
  });

  // Proxy uploads requests to the backend server
  app.use('/uploads', (req, res) => {
    const proxyUrl = `http://localhost:${BACKEND_PORT}${req.url}`;
    fetch(proxyUrl, {
      method: req.method,
      headers: req.headers,
    }).then(async (response) => {
      // Copy status and headers
      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      
      // Stream the response body
      const body = await response.arrayBuffer();
      res.send(Buffer.from(body));
    }).catch(error => {
      console.error('Proxy error:', error);
      res.status(500).send('Proxy error');
    });
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