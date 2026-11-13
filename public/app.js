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
  floorLight: '#D8B183', floorDark: '#CDA575', floorEdge: '#865F43',
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

const CONFIG = {
  colors: { bg: '#F8FAFC', ink: '#243244', muted: '#687789', edge: '#CBD5E1',
    lounge: 'rgba(111,194,151,.16)', ceo: 'rgba(255,174,104,.15)',
    inteligencia: 'rgba(14,165,233,.10)', criacao: 'rgba(203,153,226,.14)',
    distribuicao: 'rgba(245,158,11,.12)', performance: 'rgba(16,185,129,.11)',
    comercial: 'rgba(99,102,241,.11)' },
  zones: {
    lounge: { x: 24, y: 120, w: 245, h: 625, title: 'Café da Equipe' },
    inteligencia: { x: 287, y: 26, w: 264, h: 320, title: 'Inteligência' },
    criacao: { x: 567, y: 26, w: 310, h: 320, title: 'Criação' },
    ceo: { x: 893, y: 26, w: 281, h: 320, title: 'CEO · Alfred' },
    distribuicao: { x: 287, y: 362, w: 264, h: 383, title: 'Distribuição' },
    performance: { x: 567, y: 362, w: 264, h: 383, title: 'Performance' },
    comercial: { x: 847, y: 362, w: 327, h: 383, title: 'Comercial' }
  },
  desks: {
    pesquisa: { x: 356, y: 151, w: 125, h: 65 },
    copy: { x: 585, y: 151, w: 125, h: 65 },
    designer: { x: 732, y: 151, w: 125, h: 65 },
    alfred: { x: 975, y: 151, w: 125, h: 65 },
    social: { x: 356, y: 497, w: 125, h: 65 },
    trafego: { x: 637, y: 497, w: 125, h: 65 },
    sdr: { x: 859, y: 497, w: 94, h: 65 },
    closer: { x: 959, y: 497, w: 94, h: 65 },
    cs: { x: 1059, y: 497, w: 94, h: 65 }
  },
  seats: { alfred: [1037, 266], pesquisa: [419, 266], copy: [648, 266], designer: [795, 266],
    social: [419, 616], trafego: [700, 616], sdr: [906, 616], closer: [1006, 616], cs: [1106, 616] },
  loungeSeats: { pesquisa: [68, 330], copy: [145, 305], designer: [218, 330],
    social: [62, 430], trafego: [222, 430], sdr: [65, 545],
    closer: [145, 568], cs: [220, 545], alfred: [145, 665] },
  agentRadius: 17,
  projection: { originX: 600, originY: 400, xScale: .6, yScale: .28 },
  movement: { speed: 410, minSegmentMs: 180, maxSegmentMs: 1250, corridorX: 278, doorOffset: 18 }
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
  layoutStatus: document.getElementById('layoutStatus')
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
  return { x: p.originX + (x - 600) * p.xScale - (y - 390) * p.xScale,
    y: p.originY + (x - 600) * p.yScale + (y - 390) * p.yScale - height };
}
function roomEntry(zone) {
  const back = zone.y >= 350;
  const doorY = back ? zone.y : zone.y + zone.h;
  return { x: zone.x + zone.w / 2, doorY,
    outsideY: doorY + (back ? -CONFIG.movement.doorOffset : CONFIG.movement.doorOffset),
    insideY: doorY + (back ? 42 : -32), back };
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
    const wasInLounge = this.destination === 'lounge';
    const zoneId = colleague ? colleague.member.zone : this.member.zone;
    const activeZone = destination === 'lounge' ? this.routeZone : zoneId;
    const zone = colleague && colleague.destination === 'lounge' ? null : CONFIG.zones[activeZone];
    const route = [];
    if (zone && wasInLounge && destination !== 'lounge') {
      const entry = roomEntry(zone);
      route.push([CONFIG.movement.corridorX, this.y], [CONFIG.movement.corridorX, entry.outsideY],
        [entry.x, entry.outsideY], [entry.x, entry.insideY]);
    } else if (zone && destination === 'lounge' && !wasInLounge) {
      const entry = roomEntry(zone);
      route.push([entry.x, entry.insideY], [entry.x, entry.outsideY],
        [CONFIG.movement.corridorX, entry.outsideY], [CONFIG.movement.corridorX, target[1]]);
    }
    route.push(target);
    this.path = route.filter(([x, y]) => Math.hypot(x - this.x, y - this.y) > 2);
    this.trail = [];
    this.lastTrailAt = 0;
    this.destination = destination;
    if (destination !== 'lounge') this.routeZone = zone ? zoneId : null;
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
    ctx.font = isometric ? '700 10px system-ui' : '600 13px system-ui';
    ctx.textAlign = 'center';
    const labelY = y - (isometric ? 58 : 30);
    if (isometric) {
      const labelWidth = ctx.measureText(this.member.name).width + 15;
      ctx.fillStyle = '#172B3DDE';
      roundRect(x - labelWidth / 2, labelY - 12, labelWidth, 17, 5); ctx.fill();
      ctx.fillStyle = '#FFF'; ctx.fillText(this.member.name, x, labelY);
    } else {
      ctx.lineWidth = 3; ctx.strokeStyle = '#FFF'; ctx.strokeText(this.member.name, x, labelY);
      ctx.fillStyle = CONFIG.colors.ink; ctx.fillText(this.member.name, x, labelY);
    }
    if (this.status === 'working' || this.status === 'done' || this.status === 'error') {
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

function drawZone(id, zone) {
  shadow(); ctx.fillStyle = CONFIG.colors[id]; roundRect(zone.x, zone.y, zone.w, zone.h, 18); ctx.fill(); clearShadow();
  ctx.strokeStyle = CONFIG.colors.edge; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = CONFIG.colors.ink; ctx.font = '600 20px system-ui'; ctx.textAlign = 'left';
  ctx.fillText(zone.title, zone.x + 16, zone.y + 32, zone.w - 30);
}
function drawLounge() {
  const zone = CONFIG.zones.lounge;
  ctx.fillStyle = '#DCEDE0';
  roundRect(zone.x + 15, zone.y + 70, zone.w - 30, zone.h - 92, 22); ctx.fill();
  shadow(); ctx.fillStyle = '#B88762'; roundRect(40, 174, 210, 58, 10); ctx.fill(); clearShadow();
  ctx.fillStyle = '#2C4052'; roundRect(61, 182, 35, 35, 4); ctx.fill();
  ctx.fillStyle = '#84BDC5'; ctx.fillRect(68, 189, 21, 9);
  ctx.fillStyle = '#FFF8E8'; ctx.font = '700 12px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('CAFÉ', 157, 207);
  shadow(); ctx.fillStyle = '#D7A778'; roundRect(91, 395, 108, 95, 16); ctx.fill(); clearShadow();
  for (const [x, y] of [[87, 288], [173, 288], [70, 550], [185, 548]]) {
    ctx.fillStyle = '#E0B78D'; roundRect(x - 21, y - 20, 42, 40, 10); ctx.fill();
  }
  for (const [x, y] of Object.values(CONFIG.loungeSeats)) {
    ctx.fillStyle = '#5E947F'; roundRect(x - 16, y - 13, 32, 26, 10); ctx.fill();
    ctx.fillStyle = '#8DB9A2'; roundRect(x - 12, y - 9, 24, 17, 7); ctx.fill();
  }
  ctx.fillStyle = '#FFF8E8'; ctx.font = '24px system-ui'; ctx.fillText('☕', 145, 445);
}
function drawDesk(id, desk, now) {
  shadow(); ctx.fillStyle = '#D9D3C8'; roundRect(desk.x, desk.y, desk.w, desk.h, 8); ctx.fill(); clearShadow();
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
  const h = 52;
  const backA = project(zone.x, zone.y), backB = project(zone.x + zone.w, zone.y);
  const leftC = project(zone.x, zone.y + zone.h);
  const entry = roomEntry(zone);
  for (const [start, end] of entry.back ? [[0, .38], [.62, 1]] : [[0, 1]]) {
    const a = project(zone.x + zone.w * start, zone.y), b = project(zone.x + zone.w * end, zone.y);
    polygon([a, b, { x: b.x, y: b.y - h }, { x: a.x, y: a.y - h }], ISO_THEME.glass, ISO_THEME.glassEdge);
  }
  polygon([backA, leftC, { x: leftC.x, y: leftC.y - h }, { x: backA.x, y: backA.y - h }], 'rgba(148, 190, 205, .30)', ISO_THEME.glassEdge);
  ctx.strokeStyle = ISO_THEME.glassEdge; ctx.lineWidth = 2;
  for (const point of [backA, backB, leftC]) {
    ctx.beginPath(); ctx.moveTo(point.x, point.y); ctx.lineTo(point.x, point.y - h); ctx.stroke();
  }
  // Perfis verticais deixam a divisão das salas visível sem esconder as mesas.
  for (const ratio of entry.back ? [.38, .62] : [.33, .66]) {
    const p = project(zone.x + zone.w * ratio, zone.y);
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y - h); ctx.stroke();
  }
  ctx.strokeStyle = '#FFFFFF88'; ctx.lineWidth = 1;
  for (const [start, end] of entry.back ? [[0, .38], [.62, 1]] : [[0, 1]]) {
    const a = project(zone.x + zone.w * start, zone.y), b = project(zone.x + zone.w * end, zone.y);
    ctx.beginPath(); ctx.moveTo(a.x, a.y - h * .48); ctx.lineTo(b.x, b.y - h * .48); ctx.stroke();
  }
  const frontY = zone.y + zone.h;
  for (const [start, end] of entry.back ? [[0, 1]] : [[0, .32], [.68, 1]]) {
    const a = project(zone.x + zone.w * start, frontY);
    const b = project(zone.x + zone.w * end, frontY);
    polygon([a, b, { x: b.x, y: b.y - 12 }, { x: a.x, y: a.y - 12 }], '#AECAD266', '#DDEFF0');
  }
  const threshold = project(entry.x, entry.insideY);
  ctx.fillStyle = '#E9F5EF77';
  ctx.beginPath(); ctx.ellipse(threshold.x, threshold.y, 24, 5, 0, 0, Math.PI * 2); ctx.fill();
}
function drawRoomSign(id, zone) {
  const location = id === 'lounge'
    ? project(zone.x + zone.w / 2, zone.y + 70, 34)
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
  ctx.fillStyle = '#856652';
  polygon([{ x: p.x - 8, y: p.y - 10 }, { x: p.x + 8, y: p.y - 10 },
    { x: p.x + 6, y: p.y + 2 }, { x: p.x - 6, y: p.y + 2 }], '#9D7659');
  ctx.fillStyle = '#57A077';
  for (const [dx, dy, tilt] of [[-8, -22, -.6], [0, -29, 0], [9, -20, .6]]) {
    ctx.beginPath(); ctx.ellipse(p.x + dx, p.y + dy, 5, 12, tilt, 0, Math.PI * 2); ctx.fill();
  }
}
function drawIsoChair(x, y, color = ISO_THEME.chair) {
  const base = project(x, y, 3);
  const back = project(x, y - 10, 27);
  ctx.fillStyle = '#1E3446';
  ctx.fillRect(base.x - 2, base.y - 2, 4, 12);
  ctx.beginPath(); ctx.ellipse(base.x, base.y + 9, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  roundRect(back.x - 15, back.y - 12, 30, 26, 9); ctx.fill();
  ctx.fillStyle = ISO_THEME.chairLight;
  roundRect(back.x - 11, back.y - 8, 22, 17, 6); ctx.fill();
  ctx.fillStyle = '#2D4355';
  ctx.beginPath(); ctx.ellipse(base.x, base.y - 4, 17, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#9EBAAD'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(base.x - 19, base.y - 13);
  ctx.lineTo(base.x - 19, base.y - 5); ctx.moveTo(base.x + 19, base.y - 13);
  ctx.lineTo(base.x + 19, base.y - 5); ctx.stroke();
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
  polygon(top, '#E2B889', '#F6D9AD');
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
  diamond(lounge.x + 22, lounge.y + 170, lounge.w - 44, 400, '#5A9B8170', '#D7EEE2A0');
  // Balcão com máquina, copos e atendente.
  const counter = [project(44, 178, 25), project(225, 178, 25),
    project(225, 227, 25), project(44, 227, 25)];
  polygon([counter[1], counter[2], project(225, 227), project(225, 178)], '#9A704F');
  polygon([counter[2], counter[3], project(44, 227), project(225, 227)], '#AA805D');
  polygon(counter, '#DEBA8E', '#F0D2AD');
  // Placa aplicada à frente do balcão, acompanhando sua perspectiva.
  polygon([project(105, 228, 21), project(166, 228, 21),
    project(166, 228, 7), project(105, 228, 7)], '#355C60', '#E8D8B7');
  const cafeSign = project(135.5, 228, 11);
  ctx.fillStyle = '#FFF7E8'; ctx.font = '700 11px system-ui'; ctx.textAlign = 'center';
  ctx.fillText('CAFÉ', cafeSign.x, cafeSign.y);
  const machine = project(82, 190, 30);
  ctx.fillStyle = '#263B4F'; roundRect(machine.x - 14, machine.y - 24, 28, 24, 4); ctx.fill();
  ctx.fillStyle = '#79BAC2'; roundRect(machine.x - 10, machine.y - 20, 20, 9, 2); ctx.fill();
  ctx.fillStyle = '#DDE9E7'; ctx.fillRect(machine.x - 8, machine.y - 8, 16, 4);
  const cups = project(198, 191, 31);
  ctx.fillStyle = '#F8F5EE';
  for (let i = 0; i < 3; i++) {
    roundRect(cups.x + i * 7, cups.y - 9 - i * 2, 8, 10, 2); ctx.fill();
  }
  const barista = project(145, 167);
  ctx.fillStyle = '#4B5969'; roundRect(barista.x - 9, barista.y - 26, 18, 20, 5); ctx.fill();
  ctx.fillStyle = '#D9A481'; ctx.beginPath(); ctx.arc(barista.x, barista.y - 32, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2A3440'; roundRect(barista.x - 9, barista.y - 42, 18, 7, 3); ctx.fill();
  // Mesa grande de conversa e quatro mesas menores.
  drawCafeTable(93, 396, 104, 92);
  for (const [x, y] of [[87, 288], [173, 288], [70, 550], [185, 548]]) {
    drawCafeTable(x - 23, y - 20, 46, 43);
  }
  const mug = project(145, 438, 11);
  ctx.fillStyle = '#FAF5E9'; roundRect(mug.x - 8, mug.y - 10, 16, 13, 4); ctx.fill();
  ctx.strokeStyle = '#FAF5E9'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(mug.x + 9, mug.y - 4, 4, -1.3, 1.3); ctx.stroke();
  for (const [x, y] of Object.values(CONFIG.loungeSeats)) drawCafeSeat(x, y);
}
function drawIsoWalls() {
  const a = project(0, 0), b = project(1200, 0), c = project(0, 780);
  polygon([a, b, { x: b.x, y: b.y - 150 }, { x: a.x, y: a.y - 150 }], ISO_THEME.wallRight, ISO_THEME.wallTrim);
  polygon([a, c, { x: c.x, y: c.y - 150 }, { x: a.x, y: a.y - 150 }], ISO_THEME.wallLeft, ISO_THEME.wallTrim);
  const baseA = project(0, 0, 6), baseB = project(1200, 0, 6), baseC = project(0, 780, 6);
  ctx.strokeStyle = '#90A7B8'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(baseB.x, baseB.y); ctx.lineTo(baseA.x, baseA.y);
  ctx.lineTo(baseC.x, baseC.y); ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const p = project(140 + i * 200, 0);
    polygon([{ x: p.x, y: p.y - 132 }, { x: p.x + 65, y: p.y - 107 },
      { x: p.x + 65, y: p.y - 42 }, { x: p.x, y: p.y - 67 }], '#D5E4E8', '#EDF6F5');
    polygon([{ x: p.x + 5, y: p.y - 125 }, { x: p.x + 60, y: p.y - 104 },
      { x: p.x + 60, y: p.y - 50 }, { x: p.x + 5, y: p.y - 71 }], '#99C5D2');
    polygon([{ x: p.x + 5, y: p.y - 125 }, { x: p.x + 25, y: p.y - 118 },
      { x: p.x + 25, y: p.y - 66 }, { x: p.x + 5, y: p.y - 71 }], '#D4EDF0AA');
    ctx.strokeStyle = '#E8F5F5'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p.x + 33, p.y - 114); ctx.lineTo(p.x + 33, p.y - 60); ctx.stroke();
  }
}
function drawIsoDesk(id, desk, now) {
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
  polygon([top[1], top[2], base[2], base[1]], ISO_THEME.deskSide, '#8C6C53');
  polygon([top[2], top[3], base[3], base[2]], ISO_THEME.deskFront, '#88684E');
  shadow(); polygon(top, ISO_THEME.deskTop, '#F7DEBB'); clearShadow();
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

  const keyboard = [project(centerX - 28, desk.y + 42, 29), project(centerX + 28, desk.y + 42, 29),
    project(centerX + 28, desk.y + 57, 29), project(centerX - 28, desk.y + 57, 29)];
  polygon(keyboard, '#E9EDE8', '#91A7A8');
  ctx.strokeStyle = '#97A9A9'; ctx.lineWidth = .7;
  for (let row = 0; row < 2; row++) {
    const a = project(centerX - 22, desk.y + 46 + row * 6, 29);
    const b = project(centerX + 22, desk.y + 46 + row * 6, 29);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  const mouse = project(desk.x + desk.w - 13, desk.y + 48, 29);
  ctx.fillStyle = '#E9EDE8'; ctx.beginPath(); ctx.ellipse(mouse.x, mouse.y, 5, 3, -.4, 0, Math.PI * 2); ctx.fill();
  const led = project(desk.x + 9, desk.y + 12, 29);
  ctx.fillStyle = TEAM_MEMBERS[id].color;
  ctx.beginPath(); ctx.arc(led.x, led.y, 3, 0, Math.PI * 2); ctx.fill();
  const [chairX, chairY] = CONFIG.seats[id];
  drawIsoChair(chairX, chairY);
}
function drawIsoOffice(now) {
  const background = ctx.createLinearGradient(0, 0, 0, canvas.height);
  background.addColorStop(0, ISO_THEME.backdropTop);
  background.addColorStop(1, ISO_THEME.backdropBottom);
  ctx.fillStyle = background; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.shadowColor = 'rgba(0,0,0,.42)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 20;
  diamond(0, 0, 1200, 780, ISO_THEME.floorEdge); clearShadow();
  const edgeA = project(0, 780), edgeB = project(1200, 780);
  polygon([edgeA, edgeB, { x: edgeB.x, y: edgeB.y + 15 },
    { x: edgeA.x, y: edgeA.y + 15 }], '#77543E', '#A47652');
  for (let x = 0; x < 1200; x += 80) for (let y = 0; y < 780; y += 80) {
    diamond(x, y, 80, 80, (Math.floor(x / 80) + Math.floor(y / 80)) % 2
      ? ISO_THEME.floorLight : ISO_THEME.floorDark, '#E5BE93');
  }
  drawIsoWalls();
  for (const [id, zone] of Object.entries(CONFIG.zones)) {
    diamond(zone.x, zone.y, zone.w, zone.h, ISO_THEME.zones[id].floor, '#FFF4DAA0');
    if (id !== 'lounge') drawRoom(id, zone);
  }
  drawCoffeeArea();
  Object.entries(CONFIG.desks).sort((a, b) => (a[1].x + a[1].y) - (b[1].x + b[1].y))
    .forEach(([id, desk]) => drawIsoDesk(id, desk, now));
  for (const [id, zone] of Object.entries(CONFIG.zones)) {
    if (id !== 'lounge') drawPlanter(zone.x + zone.w - 25, zone.y + zone.h - 48);
    drawRoomSign(id, zone);
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
  const body = document.createElement('span'); body.textContent = text; item.append(body);
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
  detail.textContent = `${{ working: 'Em andamento', done: 'Concluída', cancelled: 'Cancelada', interrupted: 'Interrompida', failed: 'Falhou' }[task.status] || task.status} · ${task.agents.map(id => TEAM_MEMBERS[id]?.name || id).join(', ')} · ${task.simulated ? 'simulado' : 'Codex CLI'}`;
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
  while (ui.board.children.length > 30) ui.board.lastElementChild.remove();
}
function submitChat(value) {
  const text = value.trim();
  if (!text || !socket.connected) return;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  socket.emit('chat:submit', text); ui.input.value = '';
}
ui.form.addEventListener('submit', event => { event.preventDefault(); submitChat(ui.input.value); });
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
    const planned = document.createElement('small');
    planned.textContent = `Integrações futuras: ${member.plannedIntegrations.join(', ')}`;
    details.append(name, experience, personality, skills, tools, planned);
    item.append(dot, details); ui.roster.append(item);
  }
}
socket.on('team:snapshot', renderTeam);
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
socket.on('office:updated', () => { ui.officeUpdate.hidden = false; });
