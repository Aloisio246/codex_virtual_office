const express = require('express');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawn, spawnSync } = require('node:child_process');
const { Server } = require('socket.io');
const { TEAM_MEMBERS } = require('./agents');
const SKILL_TEXT = Object.fromEntries(Object.entries(TEAM_MEMBERS).map(([id, member]) => [id,
  fs.readFileSync(path.join(__dirname, 'agent-skills', member.skillFile, 'SKILL.md'), 'utf8')]));

const app = express();
const server = http.createServer(app);
const io = new Server(server, { allowRequest: (req, callback) => {
  const origin = req.headers.origin;
  callback(null, !origin || /^http:\/\/(localhost|127\.0\.0\.1):3000$/.test(origin));
} });
const PORT = 3000;

const ROUTES = {
  pesquisa: ['pesquisa', 'tendencia', 'pauta', 'trend'],
  copy: ['texto', 'copy', 'legenda', 'roteiro', 'artigo'],
  designer: ['arte', 'banner', 'criativo', 'imagem', 'design'],
  social: ['post', 'agendar', 'instagram', 'feed'],
  trafego: ['anuncio', 'trafego', 'campanha', 'facebook ads'],
  sdr: ['lead', 'contato', 'prospetar', 'prospectar'],
  closer: ['reuniao', 'proposta', 'fechar', 'contrato'],
  cs: ['cliente', 'suporte', 'entrega', 'retencao']
};
const WORKERS = Object.keys(ROUTES);
const tasks = [];
const chatHistory = [];
const STATE_FILE = path.join(process.env.AGENCY_DATA_DIR || __dirname, 'agency-state.json');
try {
  const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  for (const task of (saved.tasks || []).slice(0, 30)) {
    if (task.status === 'working') task.status = 'interrupted';
    tasks.push(task);
  }
  chatHistory.push(...(saved.chatHistory || []).slice(-100));
} catch (error) { if (error.code !== 'ENOENT') console.error('Estado salvo inválido:', error.message); }
function persist() {
  const next = `${STATE_FILE}.tmp`;
  try {
    fs.writeFileSync(next, JSON.stringify({ tasks, chatHistory }), 'utf8');
    fs.renameSync(next, STATE_FILE);
  } catch (error) { console.error('Falha ao salvar estado:', error.message); }
}
let activeTimers = [];
let taskSequence = Math.max(0, ...tasks.map(task => Number(task.id) || 0));

app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function normalize(text) {
  return text.toLocaleLowerCase('pt-BR').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[*_`~]/g, '').replace(/\s+/g, ' ');
}
function mentions(query, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\W)${escaped}(?=$|\\W)`, 'u').test(query);
}
function isOfficeRequest(query) {
  const place = /\b(area em comum|escritorio|planta do escritorio|canvas|cafe da equipe|sala do ceo)\b/.test(query)
    || (query.includes('cafeteria') && /\b(balcao|mesa|cadeira|maquina|atendente|ambiente)\b/.test(query));
  const action = /\b(adicionar|adicione|colocar|coloque|mudar|mude|melhorar|melhore|criar|crie|quero|precisamos|escolheria|deveria|implementar|desenhar|teria|poderia)\b/.test(query);
  return place && action;
}
function chat(id, text, duration = 3500) {
  const event = { agent_id: id, name: id === 'user' ? 'Usuário' : TEAM_MEMBERS[id].name,
    text, duration, timestamp: new Date().toISOString() };
  chatHistory.push(event);
  if (chatHistory.length > 100) chatHistory.shift();
  persist();
  io.emit('agent:chat', event);
}
function move(id, destination) { io.emit('agent:move', { agent_id: id, destination }); }
function updateTask(task) { persist(); io.emit('task:update', task); }
function later(callback, delay) { activeTimers.push(setTimeout(callback, delay)); }

function checkCodexLogin(callback) {
  const child = spawn('codex', ['login', 'status'], { windowsHide: true });
  let output = '';
  let finished = false;
  const finish = value => { if (!finished) { finished = true; callback(value); } };
  child.stdout.on('data', chunk => { output += chunk.toString().slice(0, 500); });
  child.stderr.on('data', chunk => { output += chunk.toString().slice(0, 500); });
  child.on('error', () => finish(false));
  child.on('close', code => finish(code === 0 && /Logged in using ChatGPT/i.test(output)));
}

function runCodex(socket, prompt) {
  move('alfred', 'work');
  const child = spawn('codex', ['exec', '--json', '--sandbox', 'read-only',
    '--skip-git-repo-check', '--ephemeral', '-C', __dirname, '-'],
    { cwd: __dirname, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  const recent = chatHistory.slice(-10).map(event => `${event.name}: ${event.text.slice(0, 450)}`).join('\n');
  const instruction = `Você é Alfred, coordenador de uma agência de marketing virtual. Skill da função:\n${SKILL_TEXT.alfred}\nResponda em português do Brasil, de forma útil e concisa. Responda à pergunta de fato; não repita ou reformule o pedido como se isso fosse uma entrega. Use o contexto recente quando houver referência a algo anterior. Se o pedido exigir uma ação que esta sessão não pode executar, diga qual ação falta. Não afirme ter criado arquivos, publicado campanhas ou concluído trabalho que não executou. Conversa recente:\n${recent}\nPedido atual: ${prompt}`;
  child.stdin.end(instruction);
  let buffer = '';
  let answer = '';
  let settled = false;
  const timeout = setTimeout(() => child.kill(), 120000);
  child.stdout.on('data', chunk => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    for (const line of lines) {
      try {
        const event = JSON.parse(line);
        if (event.type === 'item.completed' && event.item?.type === 'agent_message' && event.item.text) {
          answer = event.item.text;
        }
      } catch { /* Ignora linha incompleta ou não JSON. */ }
    }
  });
  child.on('error', () => {
    if (settled) return;
    settled = true; clearTimeout(timeout);
    move('alfred', 'lounge');
    socket.emit('codex:state', { connected: true, busy: false, error: 'Não foi possível iniciar o Codex CLI.' });
  });
  child.on('close', code => {
    if (settled) return;
    settled = true; clearTimeout(timeout);
    if (child.cancelled) return;
    move('alfred', 'lounge');
    socket.emit('codex:state', { connected: true, busy: false });
    if (code === 0 && answer) chat('alfred', answer.slice(0, 5000), 7000);
    else socket.emit('codex:state', { connected: true, busy: false, error: 'O Codex não retornou uma resposta. Confira o CLI no terminal.' });
  });
  socket.emit('codex:state', { connected: true, busy: true });
  return child;
}

function executeAgent(id, request, context, trackProcess, options = {}) {
  return new Promise(resolve => {
    const profile = TEAM_MEMBERS[id];
    if (options.writable && !profile.capabilities.includes('visual-write')) {
      resolve({ ok: false, error: `${profile.name} não tem permissão de edição visual.` });
      return;
    }
    const workDir = options.workDir || __dirname;
    const child = spawn('codex', ['exec', '--json', '--sandbox', options.writable ? 'workspace-write' : 'read-only',
      '--skip-git-repo-check', '--ephemeral', '-C', workDir, '-'],
      { cwd: workDir, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    trackProcess(child);
    const instruction = [
      `Você é ${profile.name}, ${profile.role}, da Codex Virtual Agency.`,
      `Experiência: ${profile.experience}. Habilidades: ${profile.skills.join(', ')}.`,
      `Personalidade profissional: ${profile.personality}.`,
      `Ferramentas disponíveis nesta execução: ${(options.writable ? profile.tools : ['Codex CLI', 'Leitura local']).join(', ')}.`,
      `Entregável esperado: ${profile.deliverable}.`,
      `Skill da função (orientações operacionais):\n${SKILL_TEXT[id]}`,
      options.writable
        ? 'Implemente a alteração visual pedida nos arquivos app.js e/ou index.html deste diretório. Preserve chat, Socket.io, agentes e controles existentes. Não edite outros arquivos. Rode node --check app.js. Responda com um resumo curto do que realmente modificou.'
        : options.officeManager
          ? 'Você vai coordenar uma alteração visual do escritório. Diga em uma frase qual mudança concreta delegará ao Designer. Não repita o pedido nem afirme que já implementou.'
          : 'Responda em português do Brasil. Faça trabalho intelectual real e entregue conteúdo útil em texto. Você está em modo somente leitura. Não alegue ter criado arquivos ou publicado campanhas.',
      `Contexto dos colegas: ${context || 'nenhum'}.`,
      `Pedido do usuário: ${request}`
    ].join('\n');
    child.stdin.on('error', () => {});
    child.stdin.end(instruction);
    let buffer = '';
    let answer = '';
    let finished = false;
    const timeout = setTimeout(() => child.kill(), options.writable ? 240000 : 120000);
    child.stdout.on('data', chunk => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          if (event.type === 'item.completed' && event.item?.type === 'agent_message') answer = event.item.text || answer;
        } catch { /* Linha incompleta ou não JSON. */ }
      }
    });
    const finish = (ok, error) => {
      if (finished) return;
      finished = true; clearTimeout(timeout);
      resolve({ ok, text: answer.trim(), error });
    };
    child.on('error', () => finish(false, 'Não foi possível iniciar o Codex CLI.'));
    child.on('close', code => finish(code === 0 && Boolean(answer.trim()), code === 0 ? 'Sem resposta do Codex.' : 'Codex encerrou com erro.'));
  });
}
async function executeOfficeUpdate(request, context, trackProcess) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-office-'));
  const allowed = ['app.js', 'index.html'];
  try {
    for (const name of [...allowed, 'game-loop.js']) {
      fs.copyFileSync(path.join(__dirname, 'public', name), path.join(temp, name));
    }
    const result = await executeAgent('designer', request, context, trackProcess,
      { workDir: temp, writable: true });
    if (!result.ok) return result;
    const check = spawnSync(process.execPath, ['--check', path.join(temp, 'app.js')], { encoding: 'utf8' });
    const html = fs.readFileSync(path.join(temp, 'index.html'), 'utf8');
    if (check.status !== 0 || !['id="office"', 'id="chatForm"', 'id="chatPanel"',
      'id="officeUpdate"', '/socket.io/socket.io.js', '/app.js'].every(part => html.includes(part))) {
      return { ok: false, error: 'A alteração não passou na validação; os arquivos originais foram preservados.' };
    }
    const changed = allowed.filter(name => !fs.readFileSync(path.join(temp, name))
      .equals(fs.readFileSync(path.join(__dirname, 'public', name))));
    if (!changed.length) return { ok: false, error: 'O Designer respondeu, mas não alterou os arquivos visuais.' };
    for (const name of changed) fs.copyFileSync(path.join(temp, name), path.join(__dirname, 'public', name));
    return { ...result, changed };
  } catch (error) {
    return { ok: false, error: `Falha ao aplicar a alteração visual: ${error.message}` };
  } finally {
    const resolved = path.resolve(temp), tempRoot = path.resolve(os.tmpdir());
    if (resolved.startsWith(tempRoot + path.sep) && path.basename(resolved).startsWith('codex-office-')) {
      fs.rmSync(resolved, { recursive: true, force: true });
    }
  }
}

async function runRealTeam(socket, task, prompt, selected, isCurrent, trackProcess) {
  const results = [];
  const order = ['alfred', ...selected];
  for (const id of order) {
    if (!isCurrent()) return;
    if (id !== 'alfred') {
      move('alfred', `visit:${id}`);
      await new Promise(resolve => setTimeout(resolve, 1400));
      if (!isCurrent()) return;
      chat('alfred', `${TEAM_MEMBERS[id].name}, assuma esta parte da tarefa.`, 2200);
      await new Promise(resolve => setTimeout(resolve, 900));
      if (!isCurrent()) return;
      chat(id, 'Entendido, vou para minha mesa.', 1800);
      move('alfred', 'lounge');
    }
    move(id, 'work');
    io.emit('agent:state', { agent_id: id, status: 'working' });
    const context = id === 'alfred'
      ? chatHistory.slice(-8).map(event => `${event.name}: ${event.text.slice(0, 400)}`).join('\n')
      : results.join('\n').slice(-3000);
    const result = task.kind === 'office' && id === 'designer'
      ? await executeOfficeUpdate(prompt, context, trackProcess)
      : await executeAgent(id, prompt, context, trackProcess,
        { officeManager: task.kind === 'office' && id === 'alfred' });
    if (!isCurrent()) return;
    io.emit('agent:state', { agent_id: id, status: result.ok ? 'done' : 'error' });
    move(id, 'lounge');
    if (result.ok) {
      chat(id, result.text.slice(0, 5000), 6000);
      if (result.changed) task.changedFiles = result.changed;
      task.deliverables ||= {};
      task.deliverables[id] = result.text.slice(0, 5000);
      results.push(`${TEAM_MEMBERS[id].name}: ${result.text.slice(0, 900)}`);
    } else {
      chat(id, `Não consegui concluir: ${result.error}`);
      task.status = 'failed';
      task.failedAgent = id;
      updateTask(task);
      return;
    }
    task.completedAgents = [...(task.completedAgents || []), id];
    updateTask(task);
  }
  task.status = 'done';
  task.finishedAt = new Date().toISOString();
  updateTask(task);
  if (task.kind === 'office') {
    chat('alfred', 'O Designer aplicou a mudança no escritório. Recarregue a página para vê-la.', 5000);
    io.emit('office:updated', { files: task.changedFiles || [] });
  } else chat('alfred', 'A equipe terminou as respostas. Revise as entregas no chat antes de usar ou publicar.', 5000);
}

app.get('/api/team', (_req, res) => res.json(TEAM_MEMBERS));

app.post('/api/event', (req, res) => {
  const { agent_id, status, message } = req.body || {};
  const id = agent_id === 'codex' ? 'designer' : agent_id;
  if (!TEAM_MEMBERS[id] || !['coding', 'idle'].includes(status) ||
      typeof message !== 'string' || message.length > 500) {
    return res.status(400).json({ error: 'Evento inválido.' });
  }
  const event = { agent_id: id, status, message, timestamp: new Date().toISOString() };
  io.emit('agent:event', event);
  move(id, status === 'coding' ? 'work' : 'lounge');
  res.status(202).json({ ok: true, event });
});

io.on('connection', socket => {
  let codexEnabled = false;
  let codexProcess = null;
  socket.emit('codex:state', { connected: false, busy: false });
  socket.on('codex:connect', () => checkCodexLogin(loggedIn => {
    codexEnabled = loggedIn;
    socket.emit('codex:state', { connected: loggedIn, busy: false,
      error: loggedIn ? null : 'Entre no Codex CLI com sua conta ChatGPT usando codex login.' });
  }));
  socket.on('codex:disconnect', () => {
    codexEnabled = false;
    const active = tasks.find(task => task.status === 'working' && !task.simulated);
    if (active) { active.status = 'cancelled'; updateTask(active); }
    if (codexProcess) { codexProcess.cancelled = true; codexProcess.kill(); }
    socket.emit('codex:state', { connected: false, busy: false });
  });
  socket.on('disconnect', () => {
    codexEnabled = false;
    const active = tasks.find(task => task.status === 'working' && !task.simulated);
    if (active) { active.status = 'cancelled'; updateTask(active); }
    if (codexProcess) { codexProcess.cancelled = true; codexProcess.kill(); }
  });
  socket.emit('team:snapshot', TEAM_MEMBERS);
  socket.emit('task:snapshot', tasks);
  socket.emit('chat:snapshot', chatHistory);
  socket.on('task:cancel', id => {
    const task = tasks.find(item => item.id === id && item.status === 'working');
    if (!task) return;
    ++taskSequence;
    activeTimers.forEach(clearTimeout);
    activeTimers = [];
    if (codexProcess) { codexProcess.cancelled = true; codexProcess.kill(); codexProcess = null; }
    task.status = 'cancelled';
    task.finishedAt = new Date().toISOString();
    updateTask(task);
    Object.keys(TEAM_MEMBERS).forEach(agent => move(agent, 'lounge'));
    socket.emit('codex:state', { connected: codexEnabled, busy: false });
    chat('alfred', 'Tarefa cancelada. A equipe voltou ao café.');
  });
  socket.on('chat:submit', value => {
    if (typeof value !== 'string') return;
    const prompt = value.trim();
    if (!prompt || prompt.length > 500) return;
    activeTimers.forEach(clearTimeout);
    activeTimers = [];
    const prior = tasks.find(task => task.status === 'working');
    if (prior) { prior.status = 'cancelled'; updateTask(prior); }
    const current = ++taskSequence;
    Object.keys(TEAM_MEMBERS).forEach(id => move(id, 'lounge'));
    chat('user', prompt, 0);
    if (codexProcess) { codexProcess.cancelled = true; codexProcess.kill(); codexProcess = null; }

    const query = normalize(prompt);
    const office = isOfficeRequest(query);
    const full = /\bcomplet[oa]\b/.test(query) || query.includes('lancamento');
    const selected = office ? ['designer'] : full ? WORKERS : WORKERS.filter(id => ROUTES[id].some(word => mentions(query, word)));
    if (office && !codexEnabled) {
      chat('alfred', 'Para alterar o escritório, preciso da conexão com o Codex CLI. Abra o Menu e conecte o Codex.');
      return;
    }
    if (!selected.length) {
      if (codexEnabled) codexProcess = runCodex(socket, prompt);
      else chat('alfred', 'Diga qual tarefa deseja: pesquisa, criação, distribuição, performance ou comercial.');
      return;
    }
    const task = { id: current, title: prompt, agents: selected, kind: office ? 'office' : 'marketing', status: 'working', simulated: !codexEnabled,
      createdAt: new Date().toISOString() };
    tasks.unshift(task);
    if (tasks.length > 30) tasks.length = 30;
    updateTask(task);
    if (codexEnabled) {
      socket.emit('codex:state', { connected: true, busy: true });
      runRealTeam(socket, task, prompt, selected,
        () => current === taskSequence && codexEnabled,
        child => { codexProcess = child; }).finally(() => {
          if (current === taskSequence) socket.emit('codex:state', { connected: true, busy: false });
        });
      return;
    }
    chat('alfred', full ? 'Equipe, vamos executar o lançamento por etapas!' :
      `Vou acionar: ${selected.map(id => TEAM_MEMBERS[id].name).join(', ')}.`);

    const STEP_MS = 3800;
    selected.forEach((id, index) => {
      later(() => {
        if (current !== taskSequence) return;
        move('alfred', `visit:${id}`);
      }, index * STEP_MS);
      later(() => {
        if (current !== taskSequence) return;
        chat('alfred', `${TEAM_MEMBERS[id].name}, assuma esta parte da tarefa.`, 2200);
      }, index * STEP_MS + 1400);
      later(() => {
        if (current !== taskSequence) return;
        chat(id, 'Entendido, vou para minha mesa.', 1800);
        move(id, 'work');
        move('alfred', 'lounge');
      }, index * STEP_MS + 2300);
    });
    later(() => {
      if (current !== taskSequence) return;
      selected.forEach(id => { chat(id, 'Pronto!', 3000); move(id, 'lounge'); });
      task.status = 'done';
      task.finishedAt = new Date().toISOString();
      updateTask(task);
      chat('alfred', `Chefe, ${full ? 'o lançamento' : 'a tarefa'} foi concluíd${full ? 'o' : 'a'} na simulação.`, 5000);
      activeTimers = [];
    }, (selected.length - 1) * STEP_MS + 9000);
  });
});

server.listen(PORT, process.env.HOST || '127.0.0.1', () => console.log(`Codex Virtual Agency: http://localhost:${PORT}`));
