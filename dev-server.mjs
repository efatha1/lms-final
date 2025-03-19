import express from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const BACKEND_PORT = 3001;

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
    env: { ...process.env, PORT: BACKEND_PORT }
  });

  // Wait for backend server to start
  await new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      http.get(`http://localhost:${BACKEND_PORT}/api/health`, (res) => {
        clearInterval(checkInterval);
        if (res.statusCode === 200) {
          console.log('Backend server started successfully');
          resolve();
        } else {
          reject(new Error(`Backend server returned status code ${res.statusCode}`));
        }
      }).on('error', () => {
        // Still waiting for server to start
      });
    }, 500);

    // Set a timeout for server startup
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('Backend server is starting (health check pending)...');
      resolve(); // Proceed anyway after timeout
    }, 5000);

    // Handle server process errors
    serverProcess.on('error', (err) => {
      clearInterval(checkInterval);
      reject(new Error(`Failed to start backend server: ${err.message}`));
    });
  }).catch(err => {
    console.warn(`Warning: ${err.message}`);
    console.log('Continuing with frontend server only...');
  });

  // Create a more robust proxy middleware
  const createProxyMiddleware = (path) => {
    return async (req, res) => {
      const targetUrl = `http://localhost:${BACKEND_PORT}${req.url}`;
      console.log(`Proxying ${req.method} ${req.url} to ${targetUrl}`);
      
      try {
        // Collect request body if present
        let body = null;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          const chunks = [];
          for await (const chunk of req) {
            chunks.push(chunk);
          }
          body = Buffer.concat(chunks);
        }
        
        // Forward the request to the backend
        const fetchOptions = {
          method: req.method,
          headers: {
            ...req.headers,
            host: `localhost:${BACKEND_PORT}`,
          },
          body: body,
        };
        
        // Remove problematic headers
        delete fetchOptions.headers['content-length'];
        delete fetchOptions.headers['connection'];
        
        const response = await fetch(targetUrl, fetchOptions);
        
        // Copy status and headers to the response
        res.status(response.status);
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        
        // Handle different response types
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          res.json(data);
        } else if (contentType.includes('text/')) {
          const text = await response.text();
          res.send(text);
        } else {
          // For binary data like images, PDFs, etc.
          const buffer = await response.arrayBuffer();
          res.send(Buffer.from(buffer));
        }
      } catch (error) {
        console.error(`Proxy error for ${req.url}:`, error);
        res.status(502).json({ error: 'Bad Gateway', message: 'Failed to proxy request to backend server' });
      }
    };
  };

  // Apply proxy middleware for API and uploads paths
  app.use('/api', createProxyMiddleware('/api'));
  app.use('/uploads', createProxyMiddleware('/uploads'));

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
    console.log(`Backend server running at http://localhost:${BACKEND_PORT} (internal)`);
  });
}

createServer().catch((err) => {
  console.error('Error starting development server:', err);
  process.exit(1);
});