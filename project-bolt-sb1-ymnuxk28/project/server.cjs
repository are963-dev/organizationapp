const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const QMON_URL = 'http://phoenix.dnsdhcp.provo.novell.com/qmon/open.php?tse=Alex%20Evans';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
};

const DIST_DIR = path.join(__dirname, 'dist');

function sendJson(res, statusCode, body) {
  const json = JSON.stringify(body);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

function setCorsHeaders(res, req) {
  // Same-origin: the app is served from this same server.
  // Only allow the requesting origin (localhost variants) for dev-mode Vite proxy.
  const origin = req.headers.origin;
  if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

// Resolve the outbound proxy from the standard environment variables.
// The browser reaches QMON through the OS proxy; Node does NOT automatically
// honor HTTP_PROXY/HTTPS_PROXY, so we read them ourselves.
function getEnvProxy() {
  const raw =
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    null;
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return { host: u.hostname, port: u.port ? Number(u.port) : u.protocol === 'https:' ? 443 : 8080 };
  } catch {
    return null;
  }
}

function hostMatchesNoProxy(hostname, noProxy) {
  if (!noProxy) return false;
  const entries = noProxy.split(',').map((s) => s.trim()).filter(Boolean);
  return entries.some((e) => {
    if (e === '*') return true;
    if (e.startsWith('.')) return hostname.endsWith(e) || hostname === e.slice(1);
    return hostname === e || hostname.endsWith('.' + e);
  });
}

// Fetch the QMON endpoint from Node, honoring a corporate proxy if configured.
// Callback signature: (err, qmonRes) — err has a .code property when known.
function fetchQmon(callback) {
  const target = new URL(QMON_URL);
  const noProxy = process.env.NO_PROXY || process.env.no_proxy || '';
  const proxy = hostMatchesNoProxy(target.hostname, noProxy) ? null : getEnvProxy();

  if (proxy) {
    console.log(`[sync] Fetching QMON through proxy ${proxy.host}:${proxy.port}`);
    const req = http.request(
      {
        host: proxy.host,
        port: proxy.port,
        method: 'GET',
        path: QMON_URL,
        headers: {
          Host: target.host,
          'User-Agent': 'support-command-center/1.0',
        },
        timeout: 15000,
      },
      (res) => callback(null, res)
    );
    req.on('error', (err) => callback(err, null));
    req.on('timeout', () => {
      const timeoutErr = new Error('QMON request timed out');
      timeoutErr.code = 'ETIMEDOUT';
      req.destroy(timeoutErr);
    });
    req.end();
    return;
  }

  console.log('[sync] Fetching QMON directly (no proxy configured)');
  const req = http.get(QMON_URL, { timeout: 15000 }, (res) => callback(null, res));
  req.on('error', (err) => callback(err, null));
  req.on('timeout', () => {
    const timeoutErr = new Error('QMON request timed out');
    timeoutErr.code = 'ETIMEDOUT';
    req.destroy(timeoutErr);
  });
}

function handleSync(req, res) {
  setCorsHeaders(res, req);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  if (req.method !== 'POST') {
    return false;
  }

  console.log('[sync] Received POST /api/sync');

  // Drain the request body (no sensitive data is read from it)
  req.on('data', () => {});
  req.on('end', () => {
    fetchQmon((err, qmonRes) => {
      if (err) {
        const code = err.code || 'UNKNOWN';
        console.log(`[sync] QMON request failed: ${code}`);

        let message;
        if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
          message = 'Unable to resolve the QMON hostname. Check your VPN/proxy DNS settings.';
        } else if (code === 'ETIMEDOUT') {
          message = 'QMON request timed out. Make sure you are connected to the corporate VPN/network.';
        } else if (code === 'EHOSTUNREACH' || code === 'ECONNREFUSED' || code === 'ENETUNREACH' || code === 'ECONNRESET') {
          message = 'Unable to connect to QMON. Check your VPN/network or proxy settings.';
        } else {
          message = `Unable to reach QMON: ${code}`;
        }

        sendJson(res, 200, { success: false, error: message });
        return;
      }

      if (qmonRes.statusCode !== 200) {
        console.log(`[sync] QMON responded with HTTP ${qmonRes.statusCode}`);
        sendJson(res, 502, {
          success: false,
          error: `QMON returned HTTP ${qmonRes.statusCode}`,
        });
        return;
      }

      let qmonData = '';
      qmonRes.on('data', (chunk) => {
        qmonData += chunk;
      });

      qmonRes.on('end', () => {
        console.log(`[sync] QMON returned ${Buffer.byteLength(qmonData, 'utf8')} bytes`);
        if (!qmonData || !qmonData.trim()) {
          sendJson(res, 200, {
            success: false,
            error: 'QMON returned an empty response.',
          });
          return;
        }

        sendJson(res, 200, {
          success: true,
          qmonResponse: qmonData,
        });
      });
    });
  });

  return true;
}

function serveStatic(req, res) {
  let urlPath = req.url || '/';

  // Remove query string
  const queryIdx = urlPath.indexOf('?');
  if (queryIdx !== -1) urlPath = urlPath.substring(0, queryIdx);

  // Normalize path
  if (urlPath === '/') urlPath = '/index.html';

  // Prevent path traversal
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(DIST_DIR, safePath);

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback: serve index.html for client-side routing
      if (err.code === 'ENOENT') {
        fs.readFile(path.join(DIST_DIR, 'index.html'), (fallbackErr, fallbackData) => {
          if (fallbackErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found. Run "npm run build" first.');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(fallbackData);
        });
        return;
      }
      res.writeHead(500);
      res.end('Internal server error');
      return;
    }

    const ext = path.extname(filePath);
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const urlPath = req.url || '/';

  // API routes — handled BEFORE static file serving
  if (urlPath.startsWith('/api/')) {
    if (urlPath === '/api/sync') {
      if (handleSync(req, res)) return;
    }
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  Support Command Center');
  console.log('  ======================');
  console.log('');
  console.log(`  Server running at:  http://localhost:${PORT}`);
  console.log('');
  console.log('  Open this URL in your browser to use the application.');
  console.log('');
  console.log('  Press Ctrl+C to stop the server.');
  console.log('');
});
