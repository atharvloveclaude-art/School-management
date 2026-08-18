import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

function apiDevMiddlewarePlugin(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      const dataDir = path.resolve(__dirname, 'data');
      const dataFile = path.resolve(dataDir, 'school_data.json');

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = req.url;
        res.setHeader('Content-Type', 'application/json');

        if (url === '/api/data' && req.method === 'GET') {
          try {
            if (fs.existsSync(dataFile)) {
              const content = fs.readFileSync(dataFile, 'utf-8');
              return res.end(JSON.stringify({ success: true, data: JSON.parse(content) }));
            }
          } catch (e) {
            console.error('Error reading dataFile in dev:', e);
          }
          return res.end(JSON.stringify({ success: false, message: 'No local file yet' }));
        }

        if (url === '/api/data' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              fs.writeFileSync(dataFile, JSON.stringify(parsed, null, 2), 'utf-8');
              return res.end(JSON.stringify({ success: true, message: 'Saved to local disk' }));
            } catch (err) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
            }
          });
          return;
        }

        if (url === '/api/reset' && req.method === 'POST') {
          try {
            if (fs.existsSync(dataFile)) {
              fs.unlinkSync(dataFile);
            }
            return res.end(JSON.stringify({ success: true, message: 'Reset successful' }));
          } catch (err) {
            return res.end(JSON.stringify({ success: false, error: String(err) }));
          }
        }

        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), apiDevMiddlewarePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
