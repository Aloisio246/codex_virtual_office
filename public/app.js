const TEAM_MEMBERS = {
  alfred: { name: 'Alfred', role: 'CEO / Gerência', zone: 'ceo', color: '#FF6B00' },
  pesquisa: { name: 'Pesquisa', role: 'Trend Hunter', zone: 'inteligencia', color: '#0EA5E9' },
  copy: { name: 'Copy', role: 'Copywriter', zone: 'criacao', color: '#8B5CF6' },
  designer: { name: 'Designer', role: 'Diretor de Arte', zone: 'criacao', color: '#E11D48' },
  social: { name: 'Social', role: 'Social Media', zone: 'distribuicao', color: '#F59E0B' },
  trafego: { name: 'Tráfego', role: 'Gestor de Tráfego', zone: 'performance', color: '#10B981' },
  sdr: { name: 'SDR', role: 'Pré-Vendas', zone: 'comercial', color: '#14B8A6' },
  closer: { name: 'Closer', role: 'Executivo de Contas', zone: 'comercial', color: '#6366F1' },
  cs: { name: 'CS', role: 'Pós-Vendas', zone: 'comercial', color: '#EC4899' }
};

const ISO_THEME = {
  backdropTop: '#13243A', backdropBottom: '#071321',
  floorLight: '#E8DED1', floorDark: '#DDD2C3', floorEdge: '#8B7868',
  wallLeft: '#40576E', wallRight: '#344B62', wallTrim: '#708BA2',
  glass: 'rgba(205, 231, 236, .29)', glassEdge: '#D6EAF0',
  deskTop: '#E8C49B', deskSide: '#B68B68', deskFront: '#A77C5C',
  chair: '#314B62', chairLight: '#628197',
  zones: {
    lounge: { floor: 'rgba(83, 162, 130, .38)', accent: '#73D2AA' },
    inteligencia: { floor: 'rgba(81, 152, 200, .28)', accent: '#7BC4E8' },
    criacao: { floor: 'rgba(193, 128, 188, .27)', accent: '#DE9BD7' },
    ceo: { floor: 'rgba(232, 151, 99, .29)', accent: '#F5B27D' },
    distribuicao: { floor: 'rgba(228, 177, 92, .27)', accent: '#F0CB86' },
    performance: { floor: 'rgba(90, 174, 127, .26)', accent: '#87D7AB' },
    comercial: { floor: 'rgba(128, 135, 206, .27)', accent: '#B1B8EF' }
  }
};
const DESK_TONES = {
  wood: ['#E8C49B', '#B68B68', '#A77C5C'], sage: ['#C5D5B8', '#8FA88D', '#77947D'],
  sky: ['#C2D8E5', '#8CA9BE', '#7694AA'], rose: ['#E6C6C9', '#BA939B', '#A67C86'],
  lavender: ['#D8CEEA', '#A49AC4', '#8E84AE'], amber: ['#E8CE9B', '#B99C69', '#A58655'],
  stone: ['#D6D7D4', '#A1A7A5', '#899391'], mint: ['#C6DFD6', '#8FB5A8', '#72A293'],
  navy: ['#AFC2CF', '#6C899E', '#54758A']
};
let officeProfiles = {};
let previewTimer;
function sendOfficePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    if (!socket.connected) return;
    try { socket.emit('office:preview', canvas.toDataURL('image/png')); }
    catch { /* O escritório permanece utilizável mesmo sem captura. */ }
  }, 400);
}

const CONFIG = {
  colors: { bg: '#F8FAFC', ink: '#243244', muted: '#687789', edge: '#CBD5E1',
    lounge: 'rgba(111,194,151,.16)', ceo: 'rgba(255,174,104,.15)',
    inteligencia: 'rgba(14,165,233,.10)', criacao: 'rgba(203,153,226,.14)',
    distribuicao: 'rgba(245,158,11,.12)', performance: 'rgba(16,185,129,.11)',
    comercial: 'rgba(99,102,241,.11)' },
  zones: {
    lounge: { x: 100, y: 535, w: 1340, h: 235, title: 'Café da Equipe' },
    inteligencia: { x: 20, y: 55, w: 210, h: 355, title: 'Inteligência' },
    criacao: { x: 240, y: 55, w: 285, h: 355, title: 'Criação' },
    distribuicao: { x: 535, y: 55, w: 190, h: 355, title: 'Distribuição' },
    performance: { x: 735, y: 55, w: 190, h: 355, title: 'Performance' },
    comercial: { x: 935, y: 55, w: 370, h: 355, title: 'Comercial' },
    ceo: { x: 1315, y: 55, w: 205, h: 355, title: 'CEO · Alfred' }
  },
  desks: {
    pesquisa: { x: 65, y: 160, w: 120, h: 65 },
    copy: { x: 260, y: 160, w: 110, h: 65 },
    designer: { x: 390, y: 160, w: 110, h: 65 },
    social: { x: 570, y: 160, w: 120, h: 65 },
    trafego: { x: 770, y: 160, w: 120, h: 65 },
    sdr: { x: 955, y: 160, w: 100, h: 65 },
    closer: { x: 1070, y: 160, w: 100, h: 65 },
    cs: { x: 1185, y: 160, w: 100, h: 65 },
    alfred: { x: 1357, y: 160, w: 120, h: 65 }
  },
  seats: { pesquisa: [125, 275], copy: [315, 275], designer: [445, 275],
    social: [630, 275], trafego: [830, 275], sdr: [1005, 275], closer: [1120, 275], cs: [1235, 275], alfred: [1417, 275] },
  loungeSeats: { pesquisa: [250, 640], copy: [430, 640], designer: [610, 640],
    social: [790, 640], trafego: [970, 640], sdr: [330, 725],
    closer: [555, 725], cs: [800, 725], alfred: [1040, 725] },
  agentRadius: 17,
  building: { width: 1540, depth: 800, corridorY: 475 },
  projection: { originX: 600, originY: 400, xScale: .46, yScale: .23 },
  movement: { speed: 520, minSegmentMs: 180, maxSegmentMs: 1350, doorOffset: 18 }
};

const canvas = document.getElementById('office');
const ctx = canvas.getContext('2d');
const socket = io();
const ui = {
  messages: document.getElementById('chatMessages'), logs: document.getElementById('logs'),
  chatPanel: document.getElementById('chatPanel'), chatToggle: document.getElementById('chatHistoryToggle'),
  chatClose: document.getElementById('chatClose'), chatUnread: document.getElementById('chatUnread'),
  officeUpdate: document.getElementById('officeUpdate'), reloadOffice: document.getElementById('reloadOffice'),
  board: document.getElementById('taskBoard'), connection: document.getElementById('connection'),
  roster: document.getElementById('teamRoster'), modeBadge: document.getElementById('modeBadge'),
  form: document.getElementById('chatForm'), input: document.getElementById('chatInput'),
  voice: document.getElementById('voiceButton'), mute: document.getElementById('muteButton'),
  voiceStatus: document.getElementById('voiceStatus'), panel: document.querySelector('.office-panel'),
  edit: document.getElementById('editLayout'), reset: document.getElementById('resetLayout'),
  layoutStatus: document.getElementById('layoutStatus'),
  personalize: document.getElementById('personalizeTeam')
};
const viewToggle = document.getElementById('viewToggle');
const codexConnect = document.getElementById('codexConnect');
const codexStatus = document.getElementById('codexStatus');
let codexConnected = false;
codexConnect.addEventListener('click', () => {
  codexConnect.disabled = true;
  codexStatus.textContent = codexConnected ? 'Desconectando...' : 'Verificando login local...';
  socket.emit(codexConnected ? 'codex:disconnect' : 'codex:connect');
});
socket.on('codex:state', state => {
  codexConnected = Boolean(state.connected);
  codexConnect.disabled = false;
  codexConnect.textContent = codexConnected ? 'Desconectar Codex' : 'Conectar Codex';
  codexStatus.textContent = state.error || (state.busy ? 'Equipe trabalhando via Codex CLI...' :
    codexConnected ? 'Codex CLI conectado · mudanças visuais validadas' : 'Desconectado · equipe em simulação');
  ui.modeBadge.textContent = codexConnected ? 'Codex CLI' : 'Simulação';
});
const menuToggle = document.getElementById('menuToggle');
const sideMenu = document.getElementById('sideMenu');
const menuBackdrop = document.getElementById('menuBackdrop');
function setMenuOpen(open) {
  if (open) setChatOpen(false);
  document.body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.textContent = open ? '✕ Fechar' : '☰ Menu';
  sideMenu.inert = !open;
  if (open) codexConnect.focus();
  else menuToggle.focus();
}
menuToggle.addEventListener('click', () => setMenuOpen(!document.body.classList.contains('menu-open')));
menuBackdrop.addEventListener('click', () => setMenuOpen(false));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('menu-open')) setMenuOpen(false);
  if (event.key === 'Escape' && !ui.chatPanel.hidden) setChatOpen(false);
});
let isometric = true;
function project(x, y, height = 0) {
  const p = CONFIG.projection;
  return { x: p.originX + (x - 770) * p.xScale - (y - 400) * p.xScale,
    y: p.originY + (x - 770) * p.yScale + (y - 400) * p.yScale - height };
}
function roomEntry(zone) {
  const doorY = zone.y + zone.h;
  return { x: zone.x + zone.w / 2, doorY,
    outsideY: doorY + CONFIG.movement.doorOffset,
    insideY: doorY - 32 };
}

function roundRect(x, y, w, h, r = 12) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function shadow() { ctx.shadowColor = 'rgba(0,0,0,.10)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4; }
function clearShadow() { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; }
const AVATAR_STYLES = {
  alfred: { skin: '#D89B73', hair: '#263445', accessory: 'tie' },
  pesquisa: { skin: '#B87750', hair: '#222E3B', accessory: 'glasses' },
  copy: { skin: '#E4AA83', hair: '#553A36', accessory: 'notebook' },
  designer: { skin: '#C78361', hair: '#34253D', accessory: 'beret' },
  social: { skin: '#E9B489', hair: '#694536', accessory: 'headphones' },
  trafego: { skin: '#A66A4E', hair: '#1F2937', accessory: 'glasses' },
  sdr: { skin: '#D59A76', hair: '#3C3330', accessory: 'headset' },
  closer: { skin: '#C88D69', hair: '#292B42', accessory: 'tie' },
  cs: { skin: '#E1A782', hair: '#503B40', accessory: 'headset' }
};

function drawAvatar(agent, x, y, now) {
  const style = AVATAR_STYLES[agent.id];
  const seated = (agent.destination === 'work' || agent.destination === 'lounge') && !agent.startedAt;
  const typing = seated && agent.destination === 'work' && agent.status === 'working';
  const walking = agent.startedAt !== 0;
  const step = walking ? Math.sin(now / 90) * 3 : 0;
  const bob = walking ? Math.abs(Math.sin(now / 90)) * 2 : Math.sin(now / 600 + x) * .5;
  ctx.fillStyle = '#08111C55';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#253244';
  if (seated) {
    roundRect(x - 14, y - 13, 12, 7, 3); ctx.fill();
    roundRect(x + 2, y - 13, 12, 7, 3); ctx.fill();
  } else {
    roundRect(x - 10, y - 14 + step, 8, 15, 3); ctx.fill();
    roundRect(x + 2, y - 14 - step, 8, 15, 3); ctx.fill();
  }
  const torsoY = y - (seated ? 30 : 35) - bob;
  ctx.fillStyle = agent.member.color;
  roundRect(x - 14, torsoY, 28, 25, 7); ctx.fill();
  ctx.fillStyle = '#00000020'; roundRect(x + 5, torsoY + 2, 7, 20, 3); ctx.fill();
  ctx.fillStyle = style.skin;
  if (typing) {
    const tap = Math.sin(now / 95) * 3;
    roundRect(x - 17, torsoY + 5, 6, 15 + tap, 3); ctx.fill();
    roundRect(x + 11, torsoY + 5, 6, 15 - tap, 3); ctx.fill();
  } else if (walking) {
    roundRect(x - 18, torsoY + 5 + step, 5, 18, 3); ctx.fill();
    roundRect(x + 13, torsoY + 5 - step, 5, 18, 3); ctx.fill();
  } else {
    roundRect(x - 18, torsoY + 5, 5, 18, 3); ctx.fill();
    roundRect(x + 13, torsoY + 5, 5, 18, 3); ctx.fill();
  }
  ctx.beginPath(); ctx.arc(x, torsoY - 10, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = style.hair;
  ctx.beginPath(); ctx.arc(x, torsoY - 14, 12, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillRect(x - 12, torsoY - 16, 4, 8);
  ctx.fillStyle = '#243244';
  ctx.fillRect(x - 5, torsoY - 9, 2, 2); ctx.fillRect(x + 4, torsoY - 9, 2, 2);
  if (style.accessory === 'glasses') {
    ctx.strokeStyle = '#1F2937'; ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 8, torsoY - 11, 7, 5); ctx.strokeRect(x + 1, torsoY - 11, 7, 5);
    ctx.beginPath(); ctx.moveTo(x - 1, torsoY - 9); ctx.lineTo(x + 1, torsoY - 9); ctx.stroke();
  } else if (style.accessory === 'tie') {
    ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.moveTo(x - 5, torsoY + 1); ctx.lineTo(x + 5, torsoY + 1); ctx.lineTo(x, torsoY + 10); ctx.fill();
    ctx.fillStyle = '#243244'; ctx.fillRect(x - 1, torsoY + 4, 2, 13);
  } else if (style.accessory === 'beret') {
    ctx.fillStyle = '#2A2338'; ctx.beginPath(); ctx.ellipse(x - 2, torsoY - 22, 15, 6, -.25, 0, Math.PI * 2); ctx.fill();
  } else if (style.accessory === 'headphones' || style.accessory === 'headset') {
    ctx.strokeStyle = '#263445'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, torsoY - 11, 14, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#263445'; ctx.fillRect(x - 15, torsoY - 12, 4, 10); ctx.fillRect(x + 11, torsoY - 12, 4, 10);
    if (style.accessory === 'headset') { ctx.fillRect(x + 8, torsoY - 2, 8, 2); }
  } else if (style.accessory === 'notebook') {
    ctx.fillStyle = '#FFF7D6'; roundRect(x + 11, torsoY + 10, 10, 13, 2); ctx.fill();
  }
  if (seated && agent.destination === 'lounge' && Math.sin(now / 800 + x) > .5) {
    ctx.fillStyle = '#FFF7E9'; roundRect(x + 13, torsoY + 11, 8, 9, 2); ctx.fill();
    ctx.strokeStyle = '#FFF7E9'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x + 21, torsoY + 15, 3, -1.2, 1.2); ctx.stroke();
  }
}

class Agent {
  constructor(id, member) {
    this.id = id;
    this.member = member;
    const seat = CONFIG.loungeSeats[id];
    [this.x, this.y] = seat;
    this.from = seat;
    this.target = seat;
    this.startedAt = 0;
    this.path = [];
    this.segmentDuration = 0;
    this.routeZone = null;
    this.trail = [];
    this.lastTrailAt = 0;
    this.status = 'idle';
    this.statusUntil = 0;
    this.destination = 'lounge';
    this.bubble = '';
    this.bubbleUntil = 0;
  }
  move(destination) {
    const colleagueId = destination.startsWith('visit:') ? destination.slice(6) : null;
    const colleague = colleagueId && agents[colleagueId];
    const target = destination === 'work' ? CONFIG.seats[this.id] :
      (colleague ? [colleague.x + 35, colleague.y + 20] : CONFIG.loungeSeats[this.id]);
    if (!target) return;
    const zoneId = colleague ? colleague.member.zone : this.member.zone;
    const destinationZone = destination === 'lounge' || (colleague && colleague.destination === 'lounge')
      ? null : CONFIG.zones[zoneId];
    const route = [];
    const sameCafe = this.y > CONFIG.zones.lounge.y && target[1] > CONFIG.zones.lounge.y;
    if (!sameCafe) {
      let corridorX = this.x;
      if (this.y < CONFIG.zones.inteligencia.y + CONFIG.zones.inteligencia.h && this.routeZone) {
        const exit = roomEntry(CONFIG.zones[this.routeZone]);
        route.push([exit.x, exit.insideY], [exit.x, exit.outsideY]);
        corridorX = exit.x;
      }
      route.push([corridorX, CONFIG.building.corridorY]);
      if (destinationZone) {
        const entry = roomEntry(destinationZone);
        route.push([entry.x, CONFIG.building.corridorY], [entry.x, entry.outsideY], [entry.x, entry.insideY]);
      } else route.push([target[0], CONFIG.building.corridorY]);
    }
    route.push(target);
    this.path = route.filter(([x, y]) => Math.hypot(x - this.x, y - this.y) > 2);
    this.trail = [];
    this.lastTrailAt = 0;
    this.destination = destination;
    this.routeZone = destinationZone ? zoneId : null;
    this.nextSegment(performance.now());
  }
  nextSegment(now) {
    if (!this.path.length) { this.startedAt = 0; return; }
    this.from = [this.x, this.y];
    this.target = this.path.shift();
    const distance = Math.hypot(this.target[0] - this.x, this.target[1] - this.y);
    this.segmentDuration = Math.max(CONFIG.movement.minSegmentMs,
      Math.min(CONFIG.movement.maxSegmentMs, distance / CONFIG.movement.speed * 1000));
    this.startedAt = now;
  }
  setStatus(status) {
    this.status = status;
    this.statusUntil = status === 'done' || status === 'error' ? performance.now() + 3000 : 0;
  }
  speak(text, duration = 3500) {
    const short = String(text).replace(/\s+/g, ' ').trim();
    this.bubble = short.length > 58 ? `${short.slice(0, 57)}…` : short;
    this.bubbleUntil = performance.now() + duration;
  }
  update(now) {
    if (this.statusUntil && now > this.statusUntil) { this.status = 'idle'; this.statusUntil = 0; }
    this.trail = this.trail.filter(mark => now - mark.at < 700);
    if (!this.startedAt) return;
    const t = Math.min((now - this.startedAt) / this.segmentDuration, 1);
    const eased = t * t * (3 - 2 * t);
    this.x = this.from[0] + (this.target[0] - this.from[0]) * eased;
    this.y = this.from[1] + (this.target[1] - this.from[1]) * eased;
    if (now - this.lastTrailAt > 90) {
      this.trail.push({ x: this.x, y: this.y, at: now });
      this.lastTrailAt = now;
    }
    if (t === 1) this.nextSegment(now);
  }
  draw(now) {
    for (const mark of this.trail) {
      const p = isometric ? project(mark.x, mark.y) : mark;
      ctx.fillStyle = `rgba(255,255,255,${(1 - (now - mark.at) / 700) * .22})`;
      ctx.beginPath(); ctx.ellipse(p.x, p.y - 2, 4, 2, 0, 0, Math.PI * 2); ctx.fill();
    }
    const point = isometric ? project(this.x, this.y) : { x: this.x, y: this.y };
    const x = point.x, y = point.y;
    if (this.status === 'working' && !this.startedAt) {
      ctx.fillStyle = `${this.member.color}33`;
      ctx.beginPath(); ctx.ellipse(x, y - 1, 22 + Math.sin(now / 260) * 2, 8, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (isometric) drawAvatar(this, x, y, now);
    else {
      shadow(); ctx.fillStyle = this.member.color;
      ctx.beginPath(); ctx.arc(x, y, CONFIG.agentRadius, 0, Math.PI * 2); ctx.fill(); clearShadow();
      ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(x - 5, y - 2, 2, 0, Math.PI * 2);
      ctx.arc(x + 5, y - 2, 2, 0, Math.PI * 2); ctx.fill();
    }
    if (officeProfiles[this.id]) drawPet(this, x + 20, y + 1, now);
    ctx.font = isometric ? '700 10px system-ui' : '600 13px system-ui';
    ctx.textAlign = 'center';
    const labelY = y - (isometric ? 58 : 30);
    if (isometric && (this.destination !== 'work' || this.startedAt)) {
      const labelWidth = ctx.measureText(this.member.name).width + 15;
      ctx.fillStyle = '#172B3DDE';
      roundRect(x - labelWidth / 2, labelY - 12, labelWidth, 17, 5); ctx.fill();
      ctx.fillStyle = '#FFF'; ctx.fillText(this.member.name, x, labelY);
    } else if (!isometric) {
      ctx.lineWidth = 3; ctx.strokeStyle = '#FFF'; ctx.strokeText(this.member.name, x, labelY);
      ctx.fillStyle = CONFIG.colors.ink; ctx.fillText(this.member.name, x, labelY);
    }
    if ((this.status === 'working' || this.status === 'done' || this.status === 'error') &&
        (!isometric || this.destination !== 'work' || this.startedAt)) {
      const symbol = this.status === 'working' ? '●' : this.status === 'done' ? '✓' : '!';
      ctx.fillStyle = this.status === 'error' ? '#BE384B' : this.status === 'done' ? '#159568' : this.member.color;
      ctx.beginPath(); ctx.arc(x + 26, labelY - 5, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#FFF'; ctx.font = '700 10px system-ui'; ctx.fillText(symbol, x + 26, labelY - 1);
    }
    if (this.bubble && now < this.bubbleUntil) {
      ctx.font = '11px system-ui';
      const words = this.bubble.split(' '), lines = [''];
      for (const word of words) {
        const candidate = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word;
        if (ctx.measureText(candidate).width > 145 && lines[lines.length - 1] && lines.length < 2) lines.push(word);
        else lines[lines.length - 1] = candidate;
      }
      const width = Math.min(Math.max(...lines.map(line => ctx.measureText(line).width)) + 24, 178);
      const center = Math.max(width / 2 + 5, Math.min(canvas.width - width / 2 - 5, x));
      const bubbleY = y - (isometric ? 130 : 104);
      const height = lines.length === 1 ? 31 : 43;
      shadow(); ctx.fillStyle = '#FFF'; roundRect(center - width / 2, bubbleY, width, height, 9); ctx.fill(); clearShadow();
      ctx.fillStyle = '#23374A';
      lines.forEach((line, index) => ctx.fillText(line, center, bubbleY + 19 + index * 14, width - 12));
    }
  }
}
const agents = Object.fromEntries(Object.entries(TEAM_MEMBERS).map(([id, member]) => [id, new Agent(id, member)]));

function drawPet(agent, x, y, now) {
  const profile = officeProfiles[agent.id];
  const species = profile?.petSpecies;
  if (!species) return;
  const bounce = agent.startedAt ? Math.abs(Math.sin(now / 120)) * 2 : Math.sin(now / 700 + x) * .5;
  ctx.fillStyle = '#07162255';
  ctx.beginPath(); ctx.ellipse(x, y + 1, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = species === 'bird' ? '#E5B75A' : species === 'rabbit' ? '#D8D6D0' :
    species === 'cat' ? '#778A94' : '#B7906B';
  ctx.beginPath(); ctx.ellipse(x, y - 6 - bounce, 7, species === 'bird' ? 5 : 6, 0, 0, Math.PI * 2); ctx.fill();
  if (species === 'rabbit') {
    ctx.fillRect(x - 5, y - 21 - bounce, 3, 12); ctx.fillRect(x + 2, y - 21 - bounce, 3, 12);
  } else if (species === 'cat') {
    ctx.beginPath(); ctx.moveTo(x - 7, y - 9 - bounce); ctx.lineTo(x - 6, y - 17 - bounce);
    ctx.lineTo(x - 1, y - 12 - bounce); ctx.moveTo(x + 2, y - 12 - bounce);
    ctx.lineTo(x + 6, y - 17 - bounce); ctx.lineTo(x + 7, y - 9 - bounce); ctx.fill();
  } else if (species === 'dog') {
    ctx.beginPath(); ctx.ellipse(x - 8, y - 8 - bounce, 3, 6, -.3, 0, Math.PI * 2);
    ctx.ellipse(x + 8, y - 8 - bounce, 3, 6, .3, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#F4CF69'; ctx.beginPath(); ctx.moveTo(x + 6, y - 8 - bounce);
    ctx.lineTo(x + 12, y - 6 - bounce); ctx.lineTo(x + 6, y - 4 - bounce); ctx.fill();
  }
  ctx.fillStyle = '#1E293B';
  for (const dx of [-2, 3]) { ctx.beginPath(); ctx.arc(x + dx, y - 8 - bounce, 1, 0, Math.PI * 2); ctx.fill(); }
  if (agent.destination === 'work' && !agent.startedAt && profile.petName) {
    ctx.font = '700 9px system-ui'; ctx.textAlign = 'center';
    const label = profile.petName;
    const width = Math.min(70, ctx.measureText(label).width + 9);
    ctx.fillStyle = '#172B3DEB'; roundRect(x - width / 2, y + 4, width, 14, 4); ctx.fill();
    ctx.fillStyle = '#FFF'; ctx.fillText(label, x, y + 14, width - 6);
  }
}

function drawZone(id, zone) {
  shadow(); ctx.fillStyle = CONFIG.colors[id]; roundRect(zone.x, zone.y, zone.w, zone.h, 18); ctx.fill(); clearShadow();
  ctx.strokeStyle = CONFIG.colors.edge; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = CONFIG.colors.ink; ctx.font = '600 20px system-ui'; ctx.textAlign = 'left';
  ctx.fillText(zone.title, zone.x + 16, zone.y + 32, zone.w - 30);
}
function drawLounge() {
  const zone = CONFIG.zones.lounge;
  ctx.fillStyle = '#DCEDE0';
  roundRect(zone.x + 15, zone.y + 55, zone.w - 30, zone.h - 70, 22); ctx.fill();
  shadow(); ctx.fillStyle = '#B88762'; roundRect(145, 550, 220, 50, 10); ctx.fill(); clearShadow();
  ctx.fillStyle = '#2C4052'; roundRect(166, 558, 35, 32, 4); ctx.fill();
  ctx.fillStyle = '#84BDC5'; ctx.fillRect(173, 565, 21, 9);
  ctx.fillStyle = '#FFF8E8'; ctx.font = '700 12px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('CAFÉ', 300, 583);
  for (const x of [510, 800, 1100]) {
    shadow(); ctx.fillStyle = '#D7A778'; roundRect(x - 42, 570, 84, 42, 16); ctx.fill(); clearShadow();
  }
  for (const [x, y] of Object.values(CONFIG.loungeSeats)) {
    ctx.fillStyle = '#5E947F'; roundRect(x - 16, y - 13, 32, 26, 10); ctx.fill();
    ctx.fillStyle = '#8DB9A2'; roundRect(x - 12, y - 9, 24, 17, 7); ctx.fill();
  }
  ctx.fillStyle = '#FFF8E8'; ctx.font = '24px system-ui'; ctx.fillText('☕', 600, 650);
}
function drawDesk(id, desk, now) {
  shadow(); ctx.fillStyle = (DESK_TONES[officeProfiles[id]?.deskTone] || DESK_TONES.wood)[0];
  roundRect(desk.x, desk.y, desk.w, desk.h, 8); ctx.fill(); clearShadow();
  ctx.strokeStyle = '#BEB7AA'; ctx.stroke();
  const width = Math.min(70, desk.w - 16);
  ctx.fillStyle = '#263444'; roundRect(desk.x + (desk.w - width) / 2, desk.y + 7, width, 32, 4); ctx.fill();
  ctx.fillStyle = '#34475D'; roundRect(desk.x + (desk.w - width) / 2 + 3, desk.y + 10, width - 6, 26, 2); ctx.fill();
  ctx.fillStyle = TEAM_MEMBERS[id].color;
  ctx.fillRect(desk.x + (desk.w - width) / 2 + 8, desk.y + 17, width * .34, 2);
  ctx.fillStyle = '#74B4C3';
  ctx.fillRect(desk.x + (desk.w - width) / 2 + 8, desk.y + 24, width * .55, 2);
  if (agents[id]?.status === 'working' && agents[id].destination === 'work') {
    ctx.fillStyle = TEAM_MEMBERS[id].color;
    ctx.fillRect(desk.x + (desk.w - width) / 2 + 8, desk.y + 30, 8 + Math.abs(Math.sin(now / 280)) * (width * .47), 2);
  }
  ctx.fillStyle = '#F2F3F2'; roundRect(desk.x + desk.w / 2 - 26, desk.y + 49, 52, 9, 2); ctx.fill();
  ctx.strokeStyle = '#A0B2B4'; ctx.lineWidth = 1;
  for (let x = -20; x <= 18; x += 7) {
    ctx.beginPath(); ctx.moveTo(desk.x + desk.w / 2 + x, desk.y + 52);
    ctx.lineTo(desk.x + desk.w / 2 + x + 3, desk.y + 52); ctx.stroke();
  }
  ctx.fillStyle = '#E9EDE8';
  ctx.beginPath(); ctx.ellipse(desk.x + desk.w - 11, desk.y + 51, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = CONFIG.colors.muted; ctx.font = '12px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(TEAM_MEMBERS[id].name, desk.x + desk.w / 2, desk.y - 9);
  const [chairX, chairY] = CONFIG.seats[id];
  ctx.fillStyle = '#53647A'; roundRect(chairX - 19, chairY - 18, 38, 28, 8); ctx.fill();
  ctx.fillStyle = '#73869B'; roundRect(chairX - 16, chairY - 15, 32, 16, 6); ctx.fill();
  ctx.strokeStyle = '#34495C'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(chairX - 20, chairY - 12); ctx.lineTo(chairX - 20, chairY + 4);
  ctx.moveTo(chairX + 20, chairY - 12); ctx.lineTo(chairX + 20, chairY + 4); ctx.stroke();
}
function drawPlanOffice(now) {
  ctx.fillStyle = CONFIG.colors.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
  Object.entries(CONFIG.zones).forEach(([id, zone]) => drawZone(id, zone));
  drawLounge();
  Object.entries(CONFIG.desks).forEach(([id, desk]) => drawDesk(id, desk, now));
}
function polygon(points, fill, stroke = null) {
  ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
  points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}
function diamond(x, y, w, h, fill, stroke) {
  polygon([project(x, y), project(x + w, y), project(x + w, y + h), project(x, y + h)], fill, stroke);
}
function drawRoom(id, zone) {
  const h = 34;
  const backA = project(zone.x, zone.y), leftC = project(zone.x, zone.y + zone.h);
  const entry = roomEntry(zone);
  // Painéis opacos separam os setores; a altura baixa mantém os postos visíveis.
  polygon([backA, leftC, { x: leftC.x, y: leftC.y - h }, { x: backA.x, y: backA.y - h }], '#AAB8B7', '#EDF1EA');
  const baseA = project(zone.x, zone.y, 12), baseC = project(zone.x, zone.y + zone.h, 12);
  polygon([backA, leftC, baseC, baseA], '#718A8B', '#C8D9D5');
  ctx.strokeStyle = '#E6EEEA'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(backA.x, backA.y - h); ctx.lineTo(leftC.x, leftC.y - h); ctx.stroke();
  const doorHalf = 34;
  for (const [start, end] of [[zone.x, entry.x - doorHalf], [entry.x + doorHalf, zone.x + zone.w]]) {
    const a = project(start, entry.doorY), b = project(end, entry.doorY);
    polygon([a, b, { x: b.x, y: b.y - 18 }, { x: a.x, y: a.y - 18 }], '#829A98', '#DCE8E2');
    ctx.strokeStyle = '#F4F4E9'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(a.x, a.y - 18); ctx.lineTo(b.x, b.y - 18); ctx.stroke();
  }
  const leftDoor = project(entry.x - doorHalf, entry.doorY);
  const rightDoor = project(entry.x + doorHalf, entry.doorY);
  ctx.strokeStyle = '#EDF2EB'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(leftDoor.x, leftDoor.y - 25); ctx.lineTo(leftDoor.x, leftDoor.y);
  ctx.moveTo(rightDoor.x, rightDoor.y - 25); ctx.lineTo(rightDoor.x, rightDoor.y); ctx.stroke();
  const threshold = project(entry.x, entry.doorY);
  ctx.fillStyle = '#F2EBD0';
  ctx.beginPath(); ctx.ellipse(threshold.x, threshold.y, 18, 4, 0, 0, Math.PI * 2); ctx.fill();
}
function drawRoomSign(id, zone) {
  const location = id === 'lounge'
    ? project(zone.x + zone.w / 2, zone.y + zone.h - 14, 22)
    : project(zone.x + zone.w / 2, zone.y + 28, 51);
  const title = zone.title.toUpperCase();
  ctx.font = '700 11px system-ui'; ctx.textAlign = 'center';
  const width = Math.max(86, ctx.measureText(title).width + 22);
  shadow(); ctx.fillStyle = '#223749';
  roundRect(location.x - width / 2, location.y - 13, width, 22, 6); ctx.fill(); clearShadow();
  ctx.fillStyle = ISO_THEME.zones[id].accent;
  ctx.fillRect(location.x - width / 2 + 6, location.y - 6, 3, 8);
  ctx.fillStyle = '#F9FCFC'; ctx.fillText(title, location.x + 2, location.y + 2);
}
function drawPlanter(x, y) {
  const p = project(x, y);
  ctx.fillStyle = '#071B1940';
  ctx.beginPath(); ctx.ellipse(p.x + 2, p.y + 3, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
  polygon([{ x: p.x - 9, y: p.y - 12 }, { x: p.x + 9, y: p.y - 12 },
    { x: p.x + 7, y: p.y + 2 }, { x: p.x - 7, y: p.y + 2 }], '#B88666', '#E2B899');
  ctx.fillStyle = '#325F4A'; ctx.beginPath(); ctx.ellipse(p.x, p.y - 12, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  for (const [dx, dy, tilt, color] of [[-8, -25, -.6, '#4F9B6B'], [0, -31, 0, '#74B681'],
    [9, -24, .6, '#3F8B63'], [-2, -23, .2, '#97C994']]) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(p.x + dx, p.y + dy, 5, 13, tilt, 0, Math.PI * 2); ctx.fill();
  }
}
function drawIsoChair(x, y, color = ISO_THEME.chair) {
  const base = project(x, y, 3);
  const back = project(x, y - 10, 27);
  ctx.fillStyle = '#1E3446';
  ctx.fillRect(base.x - 2, base.y - 2, 4, 12);
  ctx.beginPath(); ctx.ellipse(base.x, base.y + 9, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  shadow();
  roundRect(back.x - 15, back.y - 12, 30, 26, 9); ctx.fill();
  clearShadow();
  ctx.fillStyle = ISO_THEME.chairLight;
  roundRect(back.x - 11, back.y - 8, 22, 17, 6); ctx.fill();
  ctx.fillStyle = '#96B4BE88'; roundRect(back.x - 9, back.y - 6, 18, 5, 2); ctx.fill();
  ctx.fillStyle = '#2D4355';
  ctx.beginPath(); ctx.ellipse(base.x, base.y - 4, 17, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#9EBAAD'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(base.x - 19, base.y - 13);
  ctx.lineTo(base.x - 19, base.y - 5); ctx.moveTo(base.x + 19, base.y - 13);
  ctx.lineTo(base.x + 19, base.y - 5); ctx.stroke();
  ctx.fillStyle = '#D6E2DF';
  for (const offset of [-9, 9]) {
    ctx.beginPath(); ctx.arc(base.x + offset, base.y + 12, 2, 0, Math.PI * 2); ctx.fill();
  }
}
function drawCafeTable(x, y, w, h) {
  const center = project(x + w / 2, y + h / 2);
  ctx.fillStyle = '#1735263B';
  ctx.beginPath(); ctx.ellipse(center.x, center.y + 7, w * .38, 8, 0, 0, Math.PI * 2); ctx.fill();
  const top = [project(x, y, 16), project(x + w, y, 16),
    project(x + w, y + h, 16), project(x, y + h, 16)];
  const base = [project(x, y), project(x + w, y), project(x + w, y + h), project(x, y + h)];
  ctx.fillStyle = '#87664D';
  for (const corner of [base[2], base[3]]) ctx.fillRect(corner.x - 2, corner.y - 7, 4, 10);
  polygon([top[1], top[2], base[2], base[1]], '#A47752');
  polygon([top[2], top[3], base[3], base[2]], '#B88A61');
  shadow(); polygon(top, '#E2B889', '#F6D9AD'); clearShadow();
  const grainA = project(x + 8, y + h * .55, 17);
  const grainB = project(x + w - 8, y + h * .55, 17);
  ctx.strokeStyle = '#FFF1D0AA'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(grainA.x, grainA.y); ctx.lineTo(grainB.x, grainB.y); ctx.stroke();
}
function drawCafeSeat(x, y) {
  const p = project(x, y, 3);
  ctx.fillStyle = '#2E544A'; ctx.fillRect(p.x - 2, p.y - 4, 4, 10);
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 7, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#517E71'; roundRect(p.x - 13, p.y - 21, 26, 20, 8); ctx.fill();
  ctx.fillStyle = '#81AA92';
  ctx.beginPath(); ctx.ellipse(p.x, p.y - 4, 14, 6, 0, 0, Math.PI * 2); ctx.fill();
}
function drawCoffeeArea() {
  const lounge = CONFIG.zones.lounge;
  shadow(); diamond(lounge.x + 20, lounge.y + 18, lounge.w - 40, lounge.h - 34, '#5A9B8170', '#D7EEE2A0'); clearShadow();
  for (let y = lounge.y + 35; y < lounge.y + lounge.h - 25; y += 44) {
    const a = project(lounge.x + 29, y, 1), b = project(lounge.x + lounge.w - 29, y, 1);
    ctx.strokeStyle = '#DDF4E856'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  // Balcão com máquina, copos e atendente.
  const counter = [project(145, 550, 25), project(370, 550, 25),
    project(370, 598, 25), project(145, 598, 25)];
  polygon([counter[1], counter[2], project(370, 598), project(370, 550)], '#9A704F');
  polygon([counter[2], counter[3], project(145, 598), project(370, 598)], '#AA805D');
  polygon(counter, '#DEBA8E', '#F0D2AD');
  // Placa aplicada à frente do balcão, acompanhando sua perspectiva.
  polygon([project(228, 599, 21), project(290, 599, 21),
    project(290, 599, 7), project(228, 599, 7)], '#355C60', '#E8D8B7');
  const cafeSign = project(259, 599, 11);
  ctx.fillStyle = '#FFF7E8'; ctx.font = '700 11px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('CAFÉ', cafeSign.x, cafeSign.y);
  const machine = project(190, 564, 30);
  ctx.fillStyle = '#263B4F'; roundRect(machine.x - 14, machine.y - 29, 28, 29, 4); ctx.fill();
  ctx.fillStyle = '#79BAC2'; roundRect(machine.x - 10, machine.y - 20, 20, 9, 2); ctx.fill();
  ctx.fillStyle = '#DDE9E7'; ctx.fillRect(machine.x - 8, machine.y - 8, 16, 4);
  ctx.fillStyle = '#E6F8F2'; ctx.beginPath(); ctx.arc(machine.x + 8, machine.y - 25, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#B5D4D4'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(machine.x - 4, machine.y + 1); ctx.lineTo(machine.x - 4, machine.y + 8);
  ctx.moveTo(machine.x + 4, machine.y + 1); ctx.lineTo(machine.x + 4, machine.y + 8); ctx.stroke();
  const cups = project(345, 566, 31);
  ctx.fillStyle = '#F8F5EE';
  for (let i = 0; i < 3; i++) {
    roundRect(cups.x + i * 7, cups.y - 9 - i * 2, 8, 10, 2); ctx.fill();
  }
  const barista = project(283, 544);
  ctx.fillStyle = '#4B5969'; roundRect(barista.x - 9, barista.y - 26, 18, 20, 5); ctx.fill();
  ctx.fillStyle = '#D9A481'; ctx.beginPath(); ctx.arc(barista.x, barista.y - 32, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2A3440'; roundRect(barista.x - 9, barista.y - 42, 18, 7, 3); ctx.fill();
  // Mesas distribuídas em uma área comum contínua, em frente às salas.
  drawCafeTable(665, 555, 190, 68);
  for (const [x, y] of [[450, 588], [1050, 588], [425, 684], [720, 684], [1080, 684]]) {
    drawCafeTable(x - 28, y - 16, 56, 38);
  }
  const mug = project(760, 590, 18);
  ctx.fillStyle = '#FAF5E9'; roundRect(mug.x - 8, mug.y - 10, 16, 13, 4); ctx.fill();
  ctx.strokeStyle = '#FAF5E9'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(mug.x + 9, mug.y - 4, 4, -1.3, 1.3); ctx.stroke();
  for (const [x, y] of [[450, 588], [1050, 588], [425, 684], [720, 684], [1080, 684]]) {
    const cup = project(x, y, 17);
    ctx.fillStyle = '#FCF6E9'; roundRect(cup.x - 3, cup.y - 5, 6, 6, 2); ctx.fill();
    ctx.strokeStyle = '#FCF6E9'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cup.x + 4, cup.y - 2, 2, -.8, 1.2); ctx.stroke();
  }
  for (const [x, y] of Object.values(CONFIG.loungeSeats)) drawCafeSeat(x, y);
}
function drawIsoWalls() {
  const { width, depth } = CONFIG.building;
  const a = project(0, 0), b = project(width, 0), c = project(0, depth);
  polygon([a, b, { x: b.x, y: b.y - 150 }, { x: a.x, y: a.y - 150 }], ISO_THEME.wallRight, ISO_THEME.wallTrim);
  polygon([a, c, { x: c.x, y: c.y - 150 }, { x: a.x, y: a.y - 150 }], ISO_THEME.wallLeft, ISO_THEME.wallTrim);
  const baseA = project(0, 0, 6), baseB = project(width, 0, 6), baseC = project(0, depth, 6);
  ctx.strokeStyle = '#90A7B8'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(baseB.x, baseB.y); ctx.lineTo(baseA.x, baseA.y);
  ctx.lineTo(baseC.x, baseC.y); ctx.stroke();
  const trimA = project(0, 0, 16), trimB = project(width, 0, 16), trimC = project(0, depth, 16);
  ctx.strokeStyle = '#98ADAD'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(trimB.x, trimB.y); ctx.lineTo(trimA.x, trimA.y);
  ctx.lineTo(trimC.x, trimC.y); ctx.stroke();
  ctx.strokeStyle = '#D0DDDA'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(trimB.x, trimB.y - 4); ctx.lineTo(trimA.x, trimA.y - 4);
  ctx.lineTo(trimC.x, trimC.y - 4); ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const p = project(120 + i * 245, 0);
    polygon([{ x: p.x, y: p.y - 132 }, { x: p.x + 65, y: p.y - 107 },
      { x: p.x + 65, y: p.y - 42 }, { x: p.x, y: p.y - 67 }], '#D5E4E8', '#EDF6F5');
    polygon([{ x: p.x + 5, y: p.y - 125 }, { x: p.x + 60, y: p.y - 104 },
      { x: p.x + 60, y: p.y - 50 }, { x: p.x + 5, y: p.y - 71 }], '#99C5D2');
    polygon([{ x: p.x + 5, y: p.y - 125 }, { x: p.x + 25, y: p.y - 118 },
      { x: p.x + 25, y: p.y - 66 }, { x: p.x + 5, y: p.y - 71 }], '#D4EDF0AA');
    ctx.strokeStyle = '#E8F5F5'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x + 33, p.y - 114); ctx.lineTo(p.x + 33, p.y - 60); ctx.stroke();
    ctx.fillStyle = '#F5F6EB99';
    polygon([{ x: p.x + 6, y: p.y - 71 }, { x: p.x + 60, y: p.y - 50 },
      { x: p.x + 60, y: p.y - 45 }, { x: p.x + 6, y: p.y - 66 }], '#F5F6EB99');
  }
  for (const x of [280, 760, 1240]) {
    const p = project(x, 0);
    polygon([{ x: p.x - 16, y: p.y - 77 }, { x: p.x + 17, y: p.y - 65 },
      { x: p.x + 17, y: p.y - 32 }, { x: p.x - 16, y: p.y - 44 }], '#D7BC9B', '#F0DEC4');
    polygon([{ x: p.x - 12, y: p.y - 72 }, { x: p.x + 13, y: p.y - 62 },
      { x: p.x + 13, y: p.y - 37 }, { x: p.x - 12, y: p.y - 47 }], '#66868C');
  }
}
function drawDeskObject(id, desk) {
  const profile = officeProfiles[id];
  if (!profile) return;
  const p = project(desk.x + 13, desk.y + 47, 31);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = '#315064'; ctx.strokeStyle = '#F8FAF5'; ctx.lineWidth = 1.3;
  switch (profile.deskObject) {
    case 'mug':
      roundRect(-5, -6, 9, 8, 2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, -2, 3, -1.3, 1.3); ctx.stroke(); break;
    case 'lamp':
      ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(6, -8); ctx.lineTo(3, -12); ctx.lineTo(-3, -12); ctx.fill();
      ctx.fillRect(-6, 2, 12, 2); break;
    case 'camera':
      roundRect(-7, -7, 14, 10, 2); ctx.fill(); ctx.fillStyle = '#9AC6D1';
      ctx.beginPath(); ctx.arc(0, -2, 3, 0, Math.PI * 2); ctx.fill(); break;
    case 'headphones':
      ctx.beginPath(); ctx.arc(0, -3, 6, Math.PI, Math.PI * 2); ctx.stroke();
      ctx.fillRect(-7, -3, 3, 6); ctx.fillRect(4, -3, 3, 6); break;
    case 'trophy':
      ctx.beginPath(); ctx.moveTo(-5, -9); ctx.lineTo(5, -9); ctx.lineTo(3, -2);
      ctx.lineTo(-3, -2); ctx.fill(); ctx.fillRect(-1, -2, 2, 5); ctx.fillRect(-5, 3, 10, 2); break;
    case 'books':
      ctx.fillStyle = '#557F94'; ctx.fillRect(-7, -2, 14, 3);
      ctx.fillStyle = '#C66E74'; ctx.fillRect(-5, -6, 12, 3);
      ctx.fillStyle = '#E8C574'; ctx.fillRect(-6, -10, 11, 3); break;
    default:
      roundRect(-7, -8, 14, 11, 2); ctx.fill(); ctx.fillStyle = '#9AC6D1';
      ctx.fillRect(-5, -6, 10, 6); break;
  }
  ctx.restore();
  if (profile.plant === 'none') return;
  const plant = project(desk.x + desk.w - 10, desk.y + 13, 31);
  ctx.fillStyle = '#A77C62';
  polygon([{ x: plant.x - 4, y: plant.y - 2 }, { x: plant.x + 4, y: plant.y - 2 },
    { x: plant.x + 3, y: plant.y + 4 }, { x: plant.x - 3, y: plant.y + 4 }], '#A77C62');
  ctx.fillStyle = profile.plant === 'cactus' ? '#367E68' : '#58A17B';
  if (profile.plant === 'cactus') {
    roundRect(plant.x - 2, plant.y - 13, 4, 12, 2); ctx.fill();
    ctx.fillRect(plant.x - 5, plant.y - 8, 3, 3);
  } else {
    for (const dx of [-4, 0, 4]) {
      ctx.beginPath(); ctx.ellipse(plant.x + dx, plant.y - 9 - Math.abs(dx), 3, 7, dx / 12, 0, Math.PI * 2); ctx.fill();
    }
  }
}
function drawIsoDesk(id, desk, now) {
  const tone = DESK_TONES[officeProfiles[id]?.deskTone] || DESK_TONES.wood;
  const centerX = desk.x + desk.w / 2;
  const floor = project(centerX, desk.y + desk.h / 2);
  ctx.fillStyle = '#10223835';
  ctx.beginPath(); ctx.ellipse(floor.x, floor.y + 16, desk.w * .43, 13, 0, 0, Math.PI * 2); ctx.fill();
  const top = [project(desk.x, desk.y, 27), project(desk.x + desk.w, desk.y, 27),
    project(desk.x + desk.w, desk.y + desk.h, 27), project(desk.x, desk.y + desk.h, 27)];
  const base = [project(desk.x, desk.y), project(desk.x + desk.w, desk.y),
    project(desk.x + desk.w, desk.y + desk.h), project(desk.x, desk.y + desk.h)];
  ctx.fillStyle = '#715741';
  for (const corner of [base[2], base[3]]) ctx.fillRect(corner.x - 3, corner.y - 2, 6, 16);
  const pedestal = project(desk.x + 13, desk.y + desk.h - 9, 8);
  polygon([{ x: pedestal.x - 11, y: pedestal.y - 11 }, { x: pedestal.x + 10, y: pedestal.y - 4 },
    { x: pedestal.x + 10, y: pedestal.y + 12 }, { x: pedestal.x - 11, y: pedestal.y + 5 }], '#A57858', '#795A46');
  ctx.strokeStyle = '#D8BA96'; ctx.lineWidth = 1;
  for (const offset of [-4, 3]) {
    ctx.beginPath(); ctx.moveTo(pedestal.x - 8, pedestal.y + offset);
    ctx.lineTo(pedestal.x + 7, pedestal.y + offset + 5); ctx.stroke();
  }
  polygon([top[1], top[2], base[2], base[1]], tone[1], '#8C6C53');
  polygon([top[2], top[3], base[3], base[2]], tone[2], '#88684E');
  shadow(); polygon(top, tone[0], '#F7DEBB'); clearShadow();
  ctx.strokeStyle = '#FFF2DE75'; ctx.lineWidth = 1;
  const grainA = project(desk.x + 10, desk.y + 44, 28);
  const grainB = project(desk.x + desk.w - 10, desk.y + 44, 28);
  ctx.beginPath(); ctx.moveTo(grainA.x, grainA.y); ctx.lineTo(grainB.x, grainB.y); ctx.stroke();

  const monitor = project(centerX, desk.y + 17, 33);
  const screenWidth = Math.min(54, desk.w * .56);
  ctx.fillStyle = '#1A2A3C';
  roundRect(monitor.x - screenWidth / 2, monitor.y - 36, screenWidth, 32, 4); ctx.fill();
  ctx.fillStyle = '#0C2030';
  roundRect(monitor.x - screenWidth / 2 + 3, monitor.y - 33, screenWidth - 6, 24, 2); ctx.fill();
  ctx.fillStyle = TEAM_MEMBERS[id].color;
  ctx.fillRect(monitor.x - screenWidth / 2 + 7, monitor.y - 29, screenWidth * .38, 2);
  ctx.fillStyle = '#74B4C3';
  ctx.fillRect(monitor.x - screenWidth / 2 + 7, monitor.y - 23, screenWidth * .59, 2);
  ctx.fillStyle = '#84A0AD';
  ctx.fillRect(monitor.x - screenWidth / 2 + 7, monitor.y - 17, screenWidth * .45, 2);
  if (agents[id]?.status === 'working' && agents[id].destination === 'work') {
    ctx.fillStyle = TEAM_MEMBERS[id].color;
    const pulse = .35 + Math.abs(Math.sin(now / 300)) * .5;
    ctx.globalAlpha = pulse;
    ctx.fillRect(monitor.x - screenWidth / 2 + 7, monitor.y - 13, 7 + Math.abs(Math.sin(now / 420)) * screenWidth * .49, 2);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#96B6BD44';
  polygon([{ x: monitor.x + 3, y: monitor.y - 33 },
    { x: monitor.x + screenWidth / 2 - 3, y: monitor.y - 33 },
    { x: monitor.x + screenWidth / 2 - 3, y: monitor.y - 9 }], '#96B6BD44');
  ctx.fillStyle = '#4B6070'; ctx.fillRect(monitor.x - 2, monitor.y - 4, 4, 9);
  ctx.fillStyle = '#DCE5E3'; roundRect(monitor.x - 11, monitor.y + 5, 22, 4, 2); ctx.fill();
  ctx.fillStyle = '#101B29'; roundRect(monitor.x - screenWidth / 2 - 2, monitor.y - 38, screenWidth + 4, 2, 1); ctx.fill();

  const keyboard = [project(centerX - 28, desk.y + 42, 29), project(centerX + 28, desk.y + 42, 29),
    project(centerX + 28, desk.y + 57, 29), project(centerX - 28, desk.y + 57, 29)];
  polygon(keyboard, '#E9EDE8', '#91A7A8');
  ctx.strokeStyle = '#97A9A9'; ctx.lineWidth = .7;
  for (let row = 0; row < 2; row++) {
    const a = project(centerX - 22, desk.y + 46 + row * 6, 29);
    const b = project(centerX + 22, desk.y + 46 + row * 6, 29);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  for (let key = -18; key <= 18; key += 9) {
    const a = project(centerX + key, desk.y + 44, 30);
    const b = project(centerX + key, desk.y + 55, 30);
    ctx.strokeStyle = '#B7C6C4'; ctx.lineWidth = .7;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  const mouse = project(desk.x + desk.w - 13, desk.y + 48, 29);
  ctx.fillStyle = '#E9EDE8'; ctx.beginPath(); ctx.ellipse(mouse.x, mouse.y, 5, 3, -.4, 0, Math.PI * 2); ctx.fill();
  const led = project(desk.x + 9, desk.y + 12, 29);
  ctx.fillStyle = TEAM_MEMBERS[id].color;
  ctx.beginPath(); ctx.arc(led.x, led.y, 3, 0, Math.PI * 2); ctx.fill();
  drawDeskObject(id, desk);
  const nameplate = project(centerX, desk.y + desk.h, 16);
  const label = TEAM_MEMBERS[id].name;
  ctx.font = '700 9px system-ui'; ctx.textAlign = 'center';
  const labelWidth = Math.min(desk.w * .45, ctx.measureText(label).width + 9);
  ctx.fillStyle = '#1E3445'; roundRect(nameplate.x - labelWidth / 2, nameplate.y - 2, labelWidth, 13, 3); ctx.fill();
  ctx.fillStyle = '#FFF'; ctx.fillText(label, nameplate.x, nameplate.y + 7, labelWidth - 5);
  const [chairX, chairY] = CONFIG.seats[id];
  drawIsoChair(chairX, chairY);
}
function drawIsoOffice(now) {
  const { width, depth, corridorY } = CONFIG.building;
  const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
  background.addColorStop(0, ISO_THEME.backdropTop);
  background.addColorStop(1, ISO_THEME.backdropBottom);
  ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowColor = 'rgba(0,0,0,.42)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 20;
  diamond(0, 0, width, depth, ISO_THEME.floorEdge); clearShadow();
  const edgeA = project(0, depth), edgeB = project(width, depth);
  polygon([edgeA, edgeB, { x: edgeB.x, y: edgeB.y + 15 },
    { x: edgeA.x, y: edgeA.y + 15 }], '#77543E', '#A47652');
  for (let x = 0; x < width; x += 80) for (let y = 0; y < depth; y += 80) {
    diamond(x, y, 80, 80, (Math.floor(x / 80) + Math.floor(y / 80)) % 2
      ? ISO_THEME.floorLight : ISO_THEME.floorDark, '#E5BE9388');
    const a = project(x + 9, y + 14), b = project(x + 69, y + 14);
    ctx.strokeStyle = '#FFF5DC45'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    const c = project(x + 9, y + 65), d = project(x + 69, y + 65);
    ctx.strokeStyle = '#8F674022';
    ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
  }
  diamond(18, 420, width - 36, 110, '#CFBB9A55', '#F5DFC3AA');
  for (let x = 95; x < width; x += 95) {
    const a = project(x, corridorY - 2, 1), b = project(x + 32, corridorY - 2, 1);
    ctx.strokeStyle = '#FFF7E855'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  drawIsoWalls();
  for (const [id, zone] of Object.entries(CONFIG.zones)) {
    diamond(zone.x, zone.y, zone.w, zone.h, ISO_THEME.zones[id].floor, '#FFF4DAA0');
  }
  drawCoffeeArea();
  for (const [id, zone] of Object.entries(CONFIG.zones)) {
    if (id !== 'lounge') drawRoom(id, zone);
  }
  Object.entries(CONFIG.desks).sort((a, b) => (a[1].x + a[1].y) - (b[1].x + b[1].y))
    .forEach(([id, desk]) => drawIsoDesk(id, desk, now));
  for (const [id, zone] of Object.entries(CONFIG.zones)) {
    if (id !== 'lounge') {
      drawPlanter(zone.x + zone.w - 25, zone.y + zone.h - 48);
      drawRoomSign(id, zone);
    }
  }
}
function drawOffice(now) { if (isometric) drawIsoOffice(now); else drawPlanOffice(now); }
viewToggle.addEventListener('click', () => {
  isometric = !isometric;
  viewToggle.textContent = isometric ? 'Vista de planta' : 'Vista isométrica';
  ui.edit.disabled = isometric;
  ui.reset.disabled = isometric;
  ui.layoutStatus.textContent = isometric ? 'Escritório isométrico · visualização' : 'Arraste as mesas no modo de edição';
});
ui.edit.disabled = true;
ui.reset.disabled = true;
ui.layoutStatus.textContent = 'Escritório isométrico · visualização';
const COFFEE_TALKS = [
  ['pesquisa', 'copy', 'Encontrei uma pauta interessante.', 'Conta mais, posso criar a legenda.'],
  ['designer', 'social', 'Qual visual combina com o próximo post?', 'Algo leve para o feed!'],
  ['trafego', 'sdr', 'Como estão os leads?', 'Vou organizar os contatos.'],
  ['closer', 'cs', 'Como foi a entrega ao cliente?', 'Recebemos um retorno ótimo.'],
  ['alfred', 'pesquisa', 'Equipe, café antes da próxima pauta?', 'Combinado! ☕']
];
let coffeeTurn = 0;
let nextCoffeeTalk = performance.now() + 3500;
function updateCoffeeTalk(now) {
  if (now < nextCoffeeTalk) return;
  nextCoffeeTalk = now + 5000;
  const [first, second, lineA, lineB] = COFFEE_TALKS[Math.floor(coffeeTurn / 2) % COFFEE_TALKS.length];
  const speaker = coffeeTurn % 2 ? second : first;
  const listener = coffeeTurn % 2 ? first : second;
  coffeeTurn++;
  if (agents[speaker].destination === 'lounge' && !agents[speaker].startedAt &&
      agents[listener].destination === 'lounge' && !agents[listener].startedAt) {
    agents[speaker].speak(coffeeTurn % 2 ? lineA : lineB, 3200);
  }
}
startGameLoop(canvas, {
  update(_dt, now) { Object.values(agents).forEach(agent => agent.update(now)); updateCoffeeTalk(now); },
  render(_ctx, now) {
    drawOffice(now);
    Object.values(agents).sort((a, b) => (isometric ? project(a.x, a.y).y - project(b.x, b.y).y : a.y - b.y))
      .forEach(agent => agent.draw(now));
  }
});

function addItem(list, text, name, kind = 'system') {
  const item = document.createElement('li'); item.className = `message message--${kind}`;
  if (name) { const strong = document.createElement('strong'); strong.textContent = name; item.append(strong); }
  const body = document.createElement('span');
  if (list === ui.messages && kind !== 'user') {
    for (const part of String(text).split(/(\*\*[^*]+\*\*)/g)) {
      if (part.startsWith('**') && part.endsWith('**')) {
        const emphasis = document.createElement('b'); emphasis.textContent = part.slice(2, -2); body.append(emphasis);
      } else body.append(document.createTextNode(part));
    }
  } else body.textContent = text;
  item.append(body);
  list.append(item); while (list.children.length > 50) list.firstElementChild.remove();
  list.scrollTop = list.scrollHeight;
}
let unreadMessages = 0;
function setChatOpen(open) {
  ui.chatPanel.hidden = !open;
  ui.chatToggle.setAttribute('aria-expanded', String(open));
  ui.chatToggle.setAttribute('aria-label', open ? 'Fechar conversas' : 'Abrir conversas');
  if (open) {
    unreadMessages = 0;
    ui.chatUnread.hidden = true;
    ui.messages.scrollTop = ui.messages.scrollHeight;
  }
}
ui.chatToggle.addEventListener('click', () => setChatOpen(ui.chatPanel.hidden));
ui.chatClose.addEventListener('click', () => { setChatOpen(false); ui.chatToggle.focus(); });
ui.reloadOffice.addEventListener('click', () => window.location.reload());
function renderTask(task) {
  let item = ui.board.querySelector(`[data-task-id="${task.id}"]`);
  if (!item) { item = document.createElement('li'); item.className = 'task-card'; item.dataset.taskId = String(task.id); ui.board.prepend(item); }
  item.dataset.status = task.status;
  const title = document.createElement('strong'); title.textContent = task.title;
  const detail = document.createElement('small');
  detail.textContent = `${{ working: 'Em andamento', done: 'Concluída', cancelled: 'Cancelada', interrupted: 'Interrompida', failed: 'Falhou' }[task.status] || task.status} · ${task.status === 'working' && task.phase ? task.phase : task.agents.map(id => TEAM_MEMBERS[id]?.name || id).join(', ')} · ${task.simulated ? 'simulado' : 'Codex CLI'}`;
  item.replaceChildren(title, detail);
  if (task.status === 'working') {
    const cancel = document.createElement('button');
    cancel.type = 'button'; cancel.textContent = 'Cancelar tarefa';
    cancel.addEventListener('click', () => socket.emit('task:cancel', task.id));
    item.append(cancel);
  }
  if (task.deliverables && Object.keys(task.deliverables).length) {
    const output = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = 'Ver entregas'; output.append(summary);
    for (const [id, value] of Object.entries(task.deliverables)) {
      const block = document.createElement('p');
      block.textContent = `${TEAM_MEMBERS[id]?.name || id}: ${value}`; output.append(block);
    }
    item.append(output);
  }
  if (task.review) {
    const review = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = 'Revisão de Alfred'; review.append(summary);
    const body = document.createElement('p'); body.textContent = task.review; review.append(body);
    item.append(review);
  }
  if (task.error) {
    const error = document.createElement('p'); error.textContent = task.error; item.append(error);
  }
  while (ui.board.children.length > 30) ui.board.lastElementChild.remove();
}
function submitChat(value) {
  const text = value.trim();
  if (!text || !socket.connected) return;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  socket.emit('chat:submit', text); ui.input.value = '';
}
ui.form.addEventListener('submit', event => { event.preventDefault(); submitChat(ui.input.value); });
ui.personalize.addEventListener('click', () => {
  setMenuOpen(false);
  submitChat('Alfred, converse com cada integrante e personalize as mesas, plantas e animais de estimação virtuais da equipe; peça a Pesquisa, Copy e Designer para criar a identidade visual do escritório.');
});
let muted = false;
ui.mute.addEventListener('click', () => {
  muted = !muted; ui.mute.setAttribute('aria-pressed', String(muted));
  ui.mute.textContent = muted ? '🔇 Ativar voz' : '🔊 Mudo';
  if (muted && 'speechSynthesis' in window) window.speechSynthesis.cancel();
});
const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!Recognition) { ui.voice.disabled = true; ui.voiceStatus.textContent = 'Reconhecimento de voz indisponível neste navegador.'; }
else {
  const recognition = new Recognition(); recognition.lang = 'pt-BR'; recognition.interimResults = false;
  let listening = false;
  ui.voice.addEventListener('click', () => listening ? recognition.stop() : recognition.start());
  recognition.onstart = () => { listening = true; ui.voice.textContent = '■'; ui.voice.setAttribute('aria-pressed', 'true'); ui.voice.setAttribute('aria-label', 'Parar gravação'); ui.voiceStatus.textContent = 'Ouvindo...'; };
  recognition.onend = () => { listening = false; ui.voice.textContent = '🎙️'; ui.voice.setAttribute('aria-pressed', 'false'); ui.voice.setAttribute('aria-label', 'Gravar fala'); if (ui.voiceStatus.textContent === 'Ouvindo...') ui.voiceStatus.textContent = ''; };
  recognition.onerror = event => { ui.voiceStatus.textContent = `Falha no reconhecimento: ${event.error}`; };
  recognition.onresult = event => { ui.input.value = event.results[0][0].transcript; ui.voiceStatus.textContent = 'Fala transcrita. Toque na seta para enviar.'; ui.input.focus(); };
}

const LAYOUT_KEY = 'codex-virtual-agency-layout-v2';
const defaultDesks = structuredClone(CONFIG.desks);
function setSeat(id) {
  const desk = CONFIG.desks[id]; CONFIG.seats[id] = [desk.x + desk.w / 2, desk.y + desk.h + 50];
  if (agents[id].destination === 'work') agents[id].move('work');
}
try {
  const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null');
  if (saved && typeof saved === 'object') for (const [id, desk] of Object.entries(saved)) {
    const zone = CONFIG.zones[TEAM_MEMBERS[id]?.zone];
    if (!zone || !CONFIG.desks[id] || !Number.isFinite(desk.x) || !Number.isFinite(desk.y)) continue;
    if (desk.x >= zone.x && desk.x + CONFIG.desks[id].w <= zone.x + zone.w &&
        desk.y >= zone.y + 60 && desk.y + CONFIG.desks[id].h <= zone.y + zone.h - 60) {
      CONFIG.desks[id].x = desk.x; CONFIG.desks[id].y = desk.y; setSeat(id);
    }
  }
} catch { /* Planta padrão. */ }
let editing = false;
let dragging = null;
ui.edit.addEventListener('click', () => {
  editing = !editing; ui.panel.classList.toggle('is-editing', editing);
  ui.edit.setAttribute('aria-pressed', String(editing));
  ui.edit.textContent = editing ? 'Concluir edição' : 'Editar planta';
  ui.layoutStatus.textContent = editing ? 'Arraste as mesas dentro de cada setor' : 'Planta salva neste navegador';
  if (editing) setMenuOpen(false);
});
ui.reset.addEventListener('click', () => {
  CONFIG.desks = structuredClone(defaultDesks);
  Object.keys(CONFIG.desks).forEach(setSeat);
  localStorage.removeItem(LAYOUT_KEY);
  ui.layoutStatus.textContent = 'Planta padrão restaurada';
});
function pointer(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * canvas.width / rect.width,
    y: (event.clientY - rect.top) * canvas.height / rect.height };
}
canvas.addEventListener('pointerdown', event => {
  if (!editing) return;
  const point = pointer(event);
  for (const [id, desk] of Object.entries(CONFIG.desks).reverse()) {
    if (point.x >= desk.x && point.x <= desk.x + desk.w && point.y >= desk.y && point.y <= desk.y + desk.h) {
      dragging = { id, dx: point.x - desk.x, dy: point.y - desk.y };
      canvas.setPointerCapture(event.pointerId); ui.panel.classList.add('is-dragging'); break;
    }
  }
});
canvas.addEventListener('pointermove', event => {
  if (!dragging) return;
  const point = pointer(event);
  const desk = CONFIG.desks[dragging.id];
  const zone = CONFIG.zones[TEAM_MEMBERS[dragging.id].zone];
  desk.x = Math.round(Math.max(zone.x, Math.min(zone.x + zone.w - desk.w, point.x - dragging.dx)));
  desk.y = Math.round(Math.max(zone.y + 60, Math.min(zone.y + zone.h - 60 - desk.h, point.y - dragging.dy)));
  setSeat(dragging.id);
});
function finishDrag() {
  if (!dragging) return;
  dragging = null; ui.panel.classList.remove('is-dragging');
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(CONFIG.desks)); ui.layoutStatus.textContent = 'Planta salva neste navegador'; }
  catch { ui.layoutStatus.textContent = 'Não foi possível salvar a planta'; }
}
canvas.addEventListener('pointerup', finishDrag);
canvas.addEventListener('pointercancel', finishDrag);

socket.on('connect', () => {
  ui.connection.textContent = '● Conectado'; ui.connection.style.color = '#059669';
  codexStatus.textContent = 'Verificando Codex CLI...';
  socket.emit('codex:connect');
  sendOfficePreview();
});
socket.on('disconnect', () => { ui.connection.textContent = '● Desconectado'; ui.connection.style.color = '#B45309'; });
function renderTeam(team) {
  ui.roster.replaceChildren();
  for (const [id, member] of Object.entries(team)) {
    if (!TEAM_MEMBERS[id]) continue;
    Object.assign(TEAM_MEMBERS[id], member);
    const item = document.createElement('li');
    item.className = 'team-member'; item.dataset.agentId = id; item.dataset.status = 'idle';
    item.style.setProperty('--agent-color', member.color);
    const dot = document.createElement('span'); dot.className = 'team-member__dot';
    const details = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = `${member.name} · ${member.role}`;
    const experience = document.createElement('small'); experience.textContent = member.experience;
    const personality = document.createElement('small'); personality.textContent = `Perfil: ${member.personality}`;
    const skills = document.createElement('small'); skills.textContent = `Skills ativas: ${member.skillNames.join(', ')}`;
    const tools = document.createElement('small'); tools.textContent = `Ferramentas: ${member.tools.join(', ')}`;
    details.append(name, experience, personality, skills, tools);
    if (member.plannedIntegrations.length) {
      const planned = document.createElement('small');
      planned.textContent = `Integrações futuras: ${member.plannedIntegrations.join(', ')}`;
      details.append(planned);
    }
    item.append(dot, details); ui.roster.append(item);
  }
  renderProfileRoster();
}
function renderProfileRoster() {
  for (const item of ui.roster.children) {
    item.querySelector('.team-member__profile')?.remove();
    const profile = officeProfiles[item.dataset.agentId];
    if (!profile) continue;
    const line = document.createElement('small'); line.className = 'team-member__profile';
    const labels = {
      wood: 'madeira', sage: 'sálvia', sky: 'azul', rose: 'rosa', lavender: 'lavanda',
      amber: 'âmbar', stone: 'pedra', mint: 'menta', navy: 'azul-marinho',
      books: 'livros', mug: 'caneca', lamp: 'luminária', tablet: 'tablet',
      notebook: 'caderno', camera: 'câmera', headphones: 'fones', board: 'quadro', trophy: 'troféu',
      fern: 'samambaia', cactus: 'cacto', succulent: 'suculenta', none: 'sem planta',
      dog: 'cão', cat: 'gato', bird: 'pássaro', rabbit: 'coelho'
    };
    line.textContent = `Mesa ${labels[profile.deskTone] || profile.deskTone} · ${labels[profile.deskObject] || profile.deskObject} · ${labels[profile.plant] || profile.plant} · ${labels[profile.petSpecies] || profile.petSpecies} ${profile.petName}`;
    item.querySelector('div').append(line);
  }
}
socket.on('team:snapshot', renderTeam);
socket.on('office:profiles', profiles => {
  officeProfiles = profiles && typeof profiles === 'object' ? profiles : {};
  renderProfileRoster();
  addItem(ui.logs, 'Identidade visual da equipe atualizada.');
  sendOfficePreview();
});
socket.on('office:preview:request', sendOfficePreview);
socket.on('agent:state', event => {
  agents[event.agent_id]?.setStatus(event.status);
  const item = [...ui.roster.children].find(child => child.dataset.agentId === event.agent_id);
  if (item) item.dataset.status = event.status;
  addItem(ui.logs, `${TEAM_MEMBERS[event.agent_id]?.name || event.agent_id}: ${event.status === 'working' ? 'trabalhando no CLI' : event.status === 'done' ? 'entrega pronta' : 'erro no CLI'}`);
});
socket.on('chat:snapshot', events => {
  ui.messages.replaceChildren();
  for (const event of events) {
    addItem(ui.messages, event.text, event.name, event.agent_id === 'user' ? 'user' : 'team');
  }
});
socket.on('agent:chat', event => {
  addItem(ui.messages, event.text, event.name, event.agent_id === 'user' ? 'user' : 'team');
  if (ui.chatPanel.hidden && event.agent_id !== 'user') {
    unreadMessages += 1;
    ui.chatUnread.textContent = unreadMessages > 9 ? '9+' : String(unreadMessages);
    ui.chatUnread.hidden = false;
  }
  agents[event.agent_id]?.speak(event.text, event.duration);
  if (event.agent_id === 'alfred' && !muted && 'speechSynthesis' in window) {
    const voice = new SpeechSynthesisUtterance(event.text); voice.lang = 'pt-BR'; window.speechSynthesis.speak(voice);
  }
});
socket.on('agent:move', event => { agents[event.agent_id]?.move(event.destination); addItem(ui.logs, `${event.agent_id} → ${event.destination}`); });
socket.on('agent:event', event => {
  agents[event.agent_id]?.setStatus(event.status === 'coding' ? 'working' : 'idle');
  addItem(ui.logs, `${event.agent_id}: ${event.message}`);
});
socket.on('task:snapshot', tasks => { ui.board.replaceChildren(); [...tasks].reverse().forEach(renderTask); });
socket.on('task:update', renderTask);
socket.on('office:updated', () => { ui.officeUpdate.hidden = false; sendOfficePreview(); });
