const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const TARGET_DIR = path.resolve('./');
const EXTENSIONS = new Set(['.js', '.py', '.html', '.css', '.json', '.md']);
const colors = { blue: '\x1b[34m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', reset: '\x1b[0m' };
let idleTimer;
const recent = new Map();

function post(status, message) {
  const body = JSON.stringify({ agent_id: 'codex', status, message });
  const req = http.request({ hostname: 'localhost', port: 3000, path: '/api/event', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } }, res => {
    res.resume();
    if (res.statusCode >= 400) console.error(`${colors.red}HTTP ${res.statusCode}${colors.reset}`);
  });
  req.on('error', error => console.error(`${colors.red}${error.message}${colors.reset}`));
  req.end(body);
}

if (!fs.existsSync(TARGET_DIR) || !fs.statSync(TARGET_DIR).isDirectory()) {
  console.error(`${colors.red}Pasta inválida: ${TARGET_DIR}${colors.reset}`);
  process.exit(1);
}

try {
  fs.watch(TARGET_DIR, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    if (path.basename(filename) === 'agency-state.json' || path.basename(filename) === 'agency-state.json.tmp') return;
    const segments = path.normalize(filename).split(path.sep);
    if (segments.includes('node_modules') || segments.includes('.git')) return;
    if (!EXTENSIONS.has(path.extname(filename).toLowerCase())) return;
    const file = path.resolve(TARGET_DIR, filename);
    if (!file.startsWith(TARGET_DIR + path.sep)) return;
    try { if (!fs.statSync(file).isFile()) return; } catch { return; }
    const now = Date.now();
    if (now - (recent.get(file) || 0) < 250) return;
    recent.set(file, now);
    for (const [name, time] of recent) if (now - time > 1000) recent.delete(name);
    const name = path.basename(file);
    console.log(`${colors.blue}● Editou ${name}${colors.reset}`);
    post('coding', `Editou ${name}`);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      console.log(`${colors.yellow}○ Aguardando...${colors.reset}`);
      post('idle', 'Aguardando...');
    }, 6000);
  });
  console.log(`${colors.green}● Observação ativa${colors.reset} em ${TARGET_DIR}`);
  console.log('Monitorando .js, .py, .html, .css, .json e .md. Ctrl+C para encerrar.');
} catch (error) {
  console.error(`${colors.red}${error.message}${colors.reset}`);
  process.exit(1);
}
