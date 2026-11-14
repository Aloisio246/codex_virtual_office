const express = require('express');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { spawn, spawnSync } = require('node:child_process');
const { Server } = require('socket.io');
const { TEAM_MEMBERS } = require('./agents');
const PROFILE_SCHEMA = require('./office-profile-schema.json');
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
  pesquisa: ['pesquisa', 'pesquisar', 'pesquise', 'pesquisem', 'pesquisando', 'tendencia', 'pauta', 'trend'],
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
let officeProfiles = {};
let officeBrief = '';
const STATE_FILE = path.join(process.env.AGENCY_DATA_DIR || __dirname, 'agency-state.json');
try {
  const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  for (const task of (saved.tasks || []).slice(0, 30)) {
    if (task.status === 'working') task.status = 'interrupted';
    tasks.push(task);
  }
  chatHistory.push(...(saved.chatHistory || []).slice(-100));
  officeProfiles = saved.officeProfiles || {};
  officeBrief = saved.officeBrief || '';
} catch (error) { if (error.code !== 'ENOENT') console.error('Estado salvo inválido:', error.message); }
function persist() {
  const next = `${STATE_FILE}.tmp`;
  try {
    fs.writeFileSync(next, JSON.stringify({ tasks, chatHistory, officeProfiles, officeBrief }), 'utf8');
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
const SITE_HOST = 'impulso-ads.vercel.app';
const SITE_URL = `https://${SITE_HOST}/`;
function decodeHtml(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}
function pageEvidence(url, html) {
  const title = decodeHtml(html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '').trim();
  const description = decodeHtml(html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)/i)?.[1] || '').trim();
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || '';
  const excerpt = decodeHtml(main.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ').trim()).slice(0, 1800);
  return `Fonte ${url}: título: ${title.slice(0, 150)}; descrição: ${description.slice(0, 450)}; conteúdo principal: ${excerpt || 'não extraído'}.`;
}
async function websiteContext(message) {
  const explicit = message.match(/https?:\/\/[^\s<>"']+/i)?.[0]?.replace(/[),.;]+$/, '');
  const url = explicit || (/\bimpulso\b/i.test(normalize(message)) && /\b(site|pagina|website)\b/i.test(normalize(message)) ? SITE_URL : '');
  if (!url) return '';
  let parsed;
  try { parsed = new URL(url); } catch { return ''; }
  if (parsed.protocol !== 'https:' || parsed.hostname !== SITE_HOST) return '';
  try {
    const response = await fetch(parsed, { signal: AbortSignal.timeout(8000), redirect: 'error' });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) {
      return `O servidor não conseguiu consultar ${parsed.origin} nesta tentativa.`;
    }
    const html = (await response.text()).slice(0, 200000);
    const instagram = decodeHtml(html.match(/https:\/\/(?:www\.)?instagram\.com\/[\w.]+\/?/i)?.[0] || '');
    const evidence = [`Instagram encontrado na página inicial: ${instagram || 'não identificado'}.`,
      pageEvidence(parsed.href, html)];
    if (parsed.pathname === '/') {
      const sections = ['/gestao-de-trafego-pago', '/tracking-e-mensuracao', '/landing-pages',
        '/estrategia-digital', '/automacoes-e-integracoes', '/sobre'];
      const pages = await Promise.all(sections.map(async section => {
        const pageUrl = new URL(section, SITE_URL);
        try {
          const page = await fetch(pageUrl, { signal: AbortSignal.timeout(8000), redirect: 'error' });
          if (!page.ok || !page.headers.get('content-type')?.includes('text/html')) return null;
          return pageEvidence(pageUrl.href, (await page.text()).slice(0, 200000));
        } catch (error) { console.warn(`Falha ao ler ${section}:`, error.message); return null; }
      }));
      evidence.push(...pages.filter(Boolean));
      if (pages.some(page => !page)) evidence.push('Algumas páginas do site não puderam ser consultadas nesta tentativa.');
    }
    return `Consulta HTTP do servidor realizada em ${new Date().toISOString()}. As fontes abaixo são páginas públicas do site, não texto inventado pelo usuário. Cada trecho é limitado para caber no contexto do agente.\n${evidence.join('\n')}`;
  } catch (error) {
    console.warn('Falha ao ler site informado:', error.message);
    return `O servidor não conseguiu consultar ${parsed.origin} neste momento.`;
  }
}
function isOfficeRequest(query) {
  const place = /\b(area em comum|escritorio|planta do escritorio|canvas|cafe da equipe|sala do ceo)\b/.test(query)
    || (query.includes('cafeteria') && /\b(balcao|mesa|cadeira|maquina|atendente|ambiente)\b/.test(query));
  const action = /\b(adicionar|adicione|colocar|coloque|mudar|mude|melhorar|melhore|criar|crie|quero|precisamos|escolheria|deveria|implementar|desenhar|teria|poderia)\b/.test(query);
  return place && action;
}
function selectAgents(query, office = isOfficeRequest(query)) {
  const full = /\bcomplet[oa]\b/.test(query) || query.includes('lancamento');
  const researchRequested = /\bpesquis\w*\b/.test(query);
  return office ? ['designer'] : full ? WORKERS : WORKERS.filter(id =>
    (id === 'pesquisa' && researchRequested) || ROUTES[id].some(word => mentions(query, word)));
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
    if (options.review && (!profile.capabilities.includes('review') ||
        !profile.capabilities.includes('deliverables-read'))) {
      resolve({ ok: false, error: `${profile.name} não pode revisar entregas da equipe.` });
      return;
    }
    if (options.writable && !profile.capabilities.includes('visual-write')) {
      resolve({ ok: false, error: `${profile.name} não tem permissão de edição visual.` });
      return;
    }
    const workDir = options.workDir || __dirname;
    const args = ['exec', '--json', '--sandbox', options.writable ? 'workspace-write' : 'read-only',
      '--skip-git-repo-check', '--ephemeral', '-C', workDir];
    const lastMessagePath = options.profileInterview
      ? path.join(os.tmpdir(), `codex-office-profile-${id}-${process.pid}-${Date.now()}.json`) : null;
    if (options.profileInterview) args.push('--output-schema', path.join(__dirname, 'office-profile-schema.json'),
      '--output-last-message', lastMessagePath);
    args.push('-');
    const child = spawn('codex', args,
      { cwd: workDir, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    trackProcess(child);
    const instruction = [
      `Você é ${profile.name}, ${profile.role}, da Codex Virtual Agency.`,
      `Experiência: ${profile.experience}. Habilidades: ${profile.skills.join(', ')}.`,
      `Personalidade profissional: ${profile.personality}.`,
      `Ferramentas disponíveis nesta execução: ${(options.writable ? profile.tools :
        ['Codex CLI', 'Leitura local', ...(id === 'alfred' ? ['Quadro e entregas enviados no contexto', 'Dados públicos do site enviados no pedido'] : [])]).join(', ')}.`,
      `Entregável esperado: ${profile.deliverable}.`,
      `Skill da função (orientações operacionais):\n${SKILL_TEXT[id]}`,
      options.profileInterview
        ? 'Alfred está entrevistando você para personalizar visualmente sua estação de trabalho no escritório virtual. Responda apenas com um objeto JSON conforme o esquema solicitado. Escolha uma cor de mesa, um objeto de trabalho, uma planta e um animal de estimação virtual coerentes com sua função e personalidade. petName é o nome criativo do animal; personalTouch explica em uma frase a escolha. São propostas de ficção visual, não fatos pessoais. Não use ferramentas externas nem edite arquivos.'
        : options.writable
        ? 'Implemente a alteração visual pedida nos arquivos app.js e/ou index.html deste diretório. Preserve chat, Socket.io, agentes e controles existentes. Não edite outros arquivos. Rode node --check app.js. Responda com um resumo curto do que realmente modificou.'
        : options.review
          ? 'Você está revisando as entregas já feitas pela equipe. Leia o contexto abaixo, verifique se responde ao pedido, se fontes e hipóteses estão claras, aponte lacunas reais e dê um próximo passo concreto. As páginas citadas no pedido foram consultadas por HTTP pelo servidor nesta tarefa; avalie os trechos e seus limites, sem afirmar que o site não foi consultado apenas porque o Codex CLI não tem navegação própria. Não alegue ter acessado contas externas nem executado trabalho dos especialistas.'
        : options.visualReview
          ? 'Como líder, revise os nove perfis fictícios e as propostas de Pesquisa, Copy e Designer. Verifique coerência com as funções, legibilidade da cena, espaço e decoração dos postos. Dê um parecer curto com ajustes práticos. Não alegue pesquisa externa ou alterações em arquivos.'
        : options.managerBrief
          ? 'Prepare um briefing curto com objetivo, responsáveis e critério de aceite. O servidor vai delegar a tarefa após sua resposta; não diga que já delegou nem que a delegação falhou. Não apresente uma pesquisa ou entrega final nesta etapa.'
        : options.officeManager
          ? 'Você vai coordenar uma alteração visual do escritório. Diga em uma frase qual mudança concreta delegará ao Designer. Não repita o pedido nem afirme que já implementou.'
          : 'Responda em português do Brasil. Faça trabalho intelectual real e entregue conteúdo útil em texto. Você está em modo somente leitura. Não alegue ter criado arquivos ou publicado campanhas.',
      request.includes('Consulta HTTP do servidor')
        ? 'Os trechos do site no pedido foram coletados pelo servidor agora. Use-os como evidência com os URLs indicados. Você não precisa navegar de novo; não afirme ter aberto páginas diretamente no Codex CLI. Se uma conclusão exigir conteúdo além dos trechos, identifique essa limitação.'
        : '',
      `Contexto dos colegas: ${context || 'nenhum'}.`,
      `Pedido do usuário: ${request}`
    ].join('\n');
    child.stdin.on('error', () => {});
    child.stdin.end(instruction);
    let buffer = '';
    let answer = '';
    let stderr = '';
    let finished = false;
    const timeout = setTimeout(() => child.kill(), options.writable ? 240000 : 120000);
    const consumeLine = line => {
      try {
        const event = JSON.parse(line);
        if (event.type === 'item.completed' && event.item?.type === 'agent_message') answer = event.item.text || answer;
      } catch { /* Linha incompleta ou não JSON. */ }
    };
    child.stdout.on('data', chunk => {
      buffer += chunk.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      lines.forEach(consumeLine);
    });
    child.stderr.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-500); });
    const finish = (ok, error) => {
      if (finished) return;
      finished = true; clearTimeout(timeout);
      if (lastMessagePath) {
        try { if (!answer) answer = fs.readFileSync(lastMessagePath, 'utf8'); } catch { /* Sem arquivo final. */ }
        try { fs.rmSync(lastMessagePath, { force: true }); } catch { /* Limpeza opcional. */ }
      }
      resolve({ ok, text: answer.trim(), error });
    };
    child.on('error', () => finish(false, 'Não foi possível iniciar o Codex CLI.'));
    child.on('close', code => {
      if (buffer) consumeLine(buffer);
      if (lastMessagePath && !answer) {
        try { answer = fs.readFileSync(lastMessagePath, 'utf8'); } catch { /* Sem arquivo final. */ }
      }
      finish(code === 0 && Boolean(answer.trim()), code === 0 ? 'Sem resposta do Codex.' :
        `Codex encerrou com erro${stderr ? `: ${stderr.slice(-240)}` : '.'}`);
    });
  });
}
function parseOfficeProfile(text) {
  let value;
  try { value = JSON.parse(text); } catch { return null; }
  for (const key of PROFILE_SCHEMA.required) {
    if (typeof value[key] !== 'string' || !value[key].trim()) return null;
    if (PROFILE_SCHEMA.properties[key].enum && !PROFILE_SCHEMA.properties[key].enum.includes(value[key])) return null;
  }
  if (value.petName.length > 28 || value.personalTouch.length > 180) return null;
  return Object.fromEntries(PROFILE_SCHEMA.required.map(key => [key, value[key].trim()]));
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
  if (!TEAM_MEMBERS.alfred.capabilities.includes('orchestrate') ||
      !TEAM_MEMBERS.alfred.capabilities.includes('team-read') ||
      !TEAM_MEMBERS.alfred.capabilities.includes('task-read')) {
    task.status = 'failed'; task.error = 'Alfred não tem capacidade de coordenação.'; updateTask(task);
    chat('alfred', task.error); return;
  }
  const results = [];
  const reviewResults = [];
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
        { officeManager: task.kind === 'office' && id === 'alfred',
          managerBrief: task.kind === 'marketing' && id === 'alfred' });
    if (!isCurrent()) return;
    io.emit('agent:state', { agent_id: id, status: result.ok ? 'done' : 'error' });
    move(id, 'lounge');
    if (result.ok) {
      chat(id, result.text.slice(0, 5000), 6000);
      if (result.changed) task.changedFiles = result.changed;
      task.deliverables ||= {};
      task.deliverables[id] = result.text.slice(0, 5000);
      results.push(`${TEAM_MEMBERS[id].name}: ${result.text.slice(0, 900)}`);
      if (id !== 'alfred') reviewResults.push(`${TEAM_MEMBERS[id].name}: ${result.text.slice(0, 10000)}`);
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
  if (task.kind === 'marketing' && isCurrent()) {
    move('alfred', 'work');
    io.emit('agent:state', { agent_id: 'alfred', status: 'working' });
    chat('alfred', 'Recebi as entregas. Vou revisar as conclusões e as lacunas.', 2500);
    const reviewContext = reviewResults.join('\n\n').slice(0, 20000);
    const review = await executeAgent('alfred', prompt, reviewContext, trackProcess, { review: true });
    if (!isCurrent()) return;
    io.emit('agent:state', { agent_id: 'alfred', status: review.ok ? 'done' : 'error' });
    move('alfred', 'lounge');
    if (review.ok) {
      task.review = review.text.slice(0, 5000);
      chat('alfred', task.review, 7000);
    } else {
      task.status = 'failed'; task.error = `A revisão final falhou: ${review.error}`;
      updateTask(task); chat('alfred', task.error); return;
    }
  }
  task.status = 'done';
  task.finishedAt = new Date().toISOString();
  updateTask(task);
  if (task.kind === 'office') {
    chat('alfred', 'O Designer aplicou a mudança no escritório. Recarregue a página para vê-la.', 5000);
    io.emit('office:updated', { files: task.changedFiles || [] });
  } else chat('alfred', 'A revisão da equipe terminou. Consulte as entregas antes de usar ou publicar.', 5000);
}

function isPersonalizationRequest(query) {
  return /\bpersonaliz\w*\b/.test(query) || /animal de estimacao|decorar as mesas|identidade visual da equipe|converse com cada integrante/.test(query);
}
async function runPersonalization(task, request, isCurrent, trackProcess) {
  const draft = { ...(task.profilesDraft || {}) };
  const fail = (id, reason) => {
    task.status = 'failed'; task.failedAgent = id; task.error = reason;
    task.finishedAt = new Date().toISOString(); updateTask(task);
    move('alfred', 'lounge');
    chat('alfred', `A personalização parou em ${TEAM_MEMBERS[id]?.name || id}: ${reason}. Os visuais anteriores foram preservados.`);
  };
  for (const id of Object.keys(TEAM_MEMBERS)) {
    if (!isCurrent()) return;
    if (draft[id]) continue;
    task.phase = `Entrevista: ${TEAM_MEMBERS[id].name}`; updateTask(task);
    if (id === 'alfred') move(id, 'work');
    else move('alfred', `visit:${id}`);
    chat('alfred', id === 'alfred'
      ? 'Vou definir minha própria estação com os mesmos critérios da equipe.'
      : `${TEAM_MEMBERS[id].name}, que mesa, objeto, planta e companheiro virtual combinam com seu jeito de trabalhar?`, 3600);
    let result, chosen;
    for (let attempt = 0; attempt < 2; attempt++) {
      result = await executeAgent(id,
        'Defina seu perfil visual criativo para a estação de trabalho e o café da equipe.',
        `Pedido do usuário: ${request}. Use sua função e personalidade registradas como base.`,
        trackProcess, { profileInterview: true });
      if (!isCurrent()) return;
      chosen = result.ok ? parseOfficeProfile(result.text) : null;
      if (chosen) break;
      if (attempt === 0) chat('alfred', `A resposta de ${TEAM_MEMBERS[id].name} não veio completa. Vou repetir a entrevista.`, 2500);
    }
    if (!chosen) { fail(id, result.error || 'A entrevista não retornou um perfil visual válido.'); return; }
    draft[id] = chosen;
    task.profilesDraft = draft; task.completedAgents = [...(task.completedAgents || []), id]; updateTask(task);
    chat(id, `${chosen.personalTouch} Minha mesa terá ${chosen.deskObject} e meu companheiro virtual será ${chosen.petName}.`, 4500);
    move(id, 'lounge');
    if (id !== 'alfred') move('alfred', 'lounge');
  }
  const profilesText = JSON.stringify(draft);
  const phases = [
    ['pesquisa', 'Sintetize os nove perfis em uma pesquisa interna para o desenho do escritório. Identifique padrões, contrastes, necessidades de espaço e riscos de legibilidade. Deixe claro que os perfis são conceitos criativos dos agentes virtuais, sem alegar pesquisa externa.'],
    ['copy', 'Crie uma proposta curta de linguagem visual e microtextos para identificar os postos e os animais no escritório. Use as preferências coletadas e evite poluir a cena com rótulos longos.'],
    ['designer', 'Defina uma direção de arte concisa para aplicar as cores, objetos, plantas e animais dos nove perfis à planta isométrica existente. Priorize visibilidade das mesas, contraste e circulação. Não diga que editou arquivos; a configuração visual será aplicada pelo Canvas.']
  ];
  task.deliverables = {};
  for (const [id, instruction] of phases) {
    if (!isCurrent()) return;
    task.phase = `Pesquisa e criação: ${TEAM_MEMBERS[id].name}`; updateTask(task);
    move('alfred', `visit:${id}`);
    chat('alfred', `${TEAM_MEMBERS[id].name}, organize sua parte da identidade visual da equipe.`, 2800);
    move(id, 'work');
    io.emit('agent:state', { agent_id: id, status: 'working' });
    const result = await executeAgent(id, instruction, profilesText, trackProcess);
    if (!isCurrent()) return;
    io.emit('agent:state', { agent_id: id, status: result.ok ? 'done' : 'error' });
    move(id, 'lounge'); move('alfred', 'lounge');
    if (!result.ok) { fail(id, result.error); return; }
    task.deliverables[id] = result.text.slice(0, 5000); updateTask(task);
    chat(id, result.text.slice(0, 3500), 5500);
  }
  task.phase = 'Revisão de Alfred'; updateTask(task);
  move('alfred', 'work');
  io.emit('agent:state', { agent_id: 'alfred', status: 'working' });
  const review = await executeAgent('alfred',
    'Revise a coerência da identidade visual criada para os nove agentes virtuais. Dê um parecer curto e pontos de atenção.',
    `Perfis: ${profilesText}\nPesquisa: ${task.deliverables.pesquisa}\nCopy: ${task.deliverables.copy}\nDesign: ${task.deliverables.designer}`.slice(0, 20000),
    trackProcess, { review: true, visualReview: true });
  if (!isCurrent()) return;
  io.emit('agent:state', { agent_id: 'alfred', status: review.ok ? 'done' : 'error' });
  move('alfred', 'lounge');
  if (!review.ok) { fail('alfred', review.error); return; }
  officeProfiles = draft;
  officeBrief = [task.deliverables.pesquisa, task.deliverables.copy, task.deliverables.designer].join('\n\n');
  io.emit('office:profiles', officeProfiles);
  task.review = review.text.slice(0, 5000);
  task.status = 'done'; task.phase = 'Concluída'; task.finishedAt = new Date().toISOString();
  delete task.profilesDraft;
  updateTask(task);
  chat('alfred', 'As entrevistas e a criação terminaram. As mesas, plantas, objetos e companheiros virtuais já aparecem no escritório. Minha revisão está no quadro de tarefas.', 6000);
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
  socket.emit('office:profiles', officeProfiles);
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
  socket.on('chat:submit', async value => {
    if (typeof value !== 'string') return;
    const prompt = value.trim();
    if (!prompt || prompt.length > 500) return;
    activeTimers.forEach(clearTimeout);
    activeTimers = [];
    const prior = tasks.find(task => task.status === 'working');
    const followUp = prior?.kind === 'marketing' && /https?:\/\//i.test(prompt);
    const request = followUp ? `${prior.title}\nContexto adicional do usuário: ${prompt}` : prompt;
    if (prior) { prior.status = 'cancelled'; updateTask(prior); }
    const current = ++taskSequence;
    Object.keys(TEAM_MEMBERS).forEach(id => move(id, 'lounge'));
    chat('user', prompt, 0);
    if (codexProcess) { codexProcess.cancelled = true; codexProcess.kill(); codexProcess = null; }

    if (/\btodos\b.*\b(cadeiras|mesas|postos)\b/.test(normalize(prompt))) {
      Object.keys(TEAM_MEMBERS).forEach(id => move(id, 'work'));
      chat('alfred', 'Equipe, ocupem seus postos. Todos estão indo para suas mesas.');
      return;
    }
    const site = await websiteContext(prompt);
    if (current !== taskSequence) return;
    if (site) {
      const instagram = site.match(/https:\/\/(?:www\.)?instagram\.com\/[\w.]+\/?/)?.[0] || 'perfil não identificado';
      chat('alfred', site.includes('Instagram encontrado')
        ? `Consultei o site da Impulso e seis páginas internas. Instagram: ${instagram}. Vou repassar as fontes à equipe.`
        : site, 5000);
    }
    const effectivePrompt = site ? `${request}\n${site}` : request;
    const query = normalize(request);
    if (isPersonalizationRequest(query)) {
      if (!codexEnabled) {
        chat('alfred', 'Preciso do Codex CLI conectado para entrevistar a equipe e criar perfis reais. Abra o Menu e conecte o Codex.');
        return;
      }
      const latestPersonalization = tasks.find(item => item.kind === 'personalization');
      const resumeDraft = latestPersonalization?.status === 'failed' ? latestPersonalization.profilesDraft : null;
      const task = { id: current, title: prompt, agents: Object.keys(TEAM_MEMBERS), kind: 'personalization',
        status: 'working', simulated: false, phase: 'Iniciando entrevistas', createdAt: new Date().toISOString() };
      if (resumeDraft) {
        task.profilesDraft = { ...resumeDraft };
        task.completedAgents = Object.keys(resumeDraft);
        chat('alfred', `Vou retomar as entrevistas: ${task.completedAgents.length} perfis já estão salvos.`);
      }
      tasks.unshift(task); if (tasks.length > 30) tasks.length = 30; updateTask(task);
      socket.emit('codex:state', { connected: true, busy: true });
      runPersonalization(task, prompt, () => current === taskSequence && codexEnabled,
        child => { codexProcess = child; }).catch(error => {
          if (current !== taskSequence) return;
          task.status = 'failed'; task.error = `Falha na personalização: ${error.message}`;
          updateTask(task); chat('alfred', task.error);
        }).finally(() => {
          if (current === taskSequence) socket.emit('codex:state', { connected: true, busy: false });
        });
      return;
    }
    const office = isOfficeRequest(query);
    const full = /\bcomplet[oa]\b/.test(query) || query.includes('lancamento');
    const selected = selectAgents(query, office);
    if (office && !codexEnabled) {
      chat('alfred', 'Para alterar o escritório, preciso da conexão com o Codex CLI. Abra o Menu e conecte o Codex.');
      return;
    }
    if (!selected.length) {
      if (codexEnabled) codexProcess = runCodex(socket, effectivePrompt);
      else chat('alfred', 'Diga qual tarefa deseja: pesquisa, criação, distribuição, performance ou comercial.');
      return;
    }
    const task = { id: current, title: request, agents: selected, kind: office ? 'office' : 'marketing', status: 'working', simulated: !codexEnabled,
      createdAt: new Date().toISOString() };
    tasks.unshift(task);
    if (tasks.length > 30) tasks.length = 30;
    updateTask(task);
    if (codexEnabled) {
      socket.emit('codex:state', { connected: true, busy: true });
      runRealTeam(socket, task, effectivePrompt, selected,
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

if (require.main === module) {
  server.listen(PORT, process.env.HOST || '127.0.0.1', () => console.log(`Codex Virtual Agency: http://localhost:${PORT}`));
}
module.exports = { normalize, selectAgents, websiteContext, isPersonalizationRequest, parseOfficeProfile };
