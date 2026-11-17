const test = require('node:test');
const assert = require('node:assert/strict');
const { normalize, selectAgents, websiteContext, isPersonalizationRequest, isVisualReviewRequest,
  parseOfficeProfile, uniquePetNames } = require('../server');
const { TEAM_MEMBERS } = require('../agents');

test('pedido de pesquisar novamente é delegado ao pesquisador', () => {
  assert.deepEqual(selectAgents(normalize('manda eles pesquisar novamente o site da impulso')), ['pesquisa']);
  assert.deepEqual(selectAgents(normalize('pesquisa e calendário para instagram')), ['pesquisa', 'social']);
});

test('Alfred coordena e revisa sem receber edição visual ou acesso externo', () => {
  assert.ok(TEAM_MEMBERS.alfred.capabilities.includes('orchestrate'));
  assert.ok(TEAM_MEMBERS.alfred.capabilities.includes('review'));
  assert.ok(TEAM_MEMBERS.alfred.capabilities.includes('team-read'));
  assert.ok(TEAM_MEMBERS.alfred.capabilities.includes('task-read'));
  assert.ok(TEAM_MEMBERS.alfred.capabilities.includes('deliverables-read'));
  assert.ok(!TEAM_MEMBERS.alfred.capabilities.includes('visual-write'));
  assert.ok(!TEAM_MEMBERS.alfred.capabilities.includes('external-account'));
});

test('referência ao site da Impulso recupera o endereço conhecido e seus dados públicos', async () => {
  const originalFetch = global.fetch;
  const requested = [];
  global.fetch = async url => {
    requested.push(String(url));
    return { ok: true, headers: { get: () => 'text/html' }, text: async () =>
      '<title>Impulso Ads</title><meta name="description" content="Marketing com dados"><main><h1>Tráfego e tecnologia</h1></main><a href="https://www.instagram.com/_impulso_ads/">Instagram</a>' };
  };
  try {
    const result = await websiteContext('pesquisar novamente o site da impulso');
    assert.match(result, /Consulta HTTP do servidor realizada em/);
    assert.match(result, /Instagram encontrado na página inicial: https:\/\/www\.instagram\.com\/_impulso_ads\//);
    assert.match(result, /conteúdo principal: Tráfego e tecnologia/);
    assert.ok(requested.includes('https://impulso-ads.vercel.app/'));
    assert.ok(requested.includes('https://impulso-ads.vercel.app/sobre'));
    assert.equal(requested.length, 7);
  } finally { global.fetch = originalFetch; }
});

test('pedido de identidade visual ativa entrevistas e valida perfil estruturado', () => {
  assert.equal(isPersonalizationRequest(normalize('Alfred, converse com cada integrante para personalizar a mesa e os pets')), true);
  const profile = parseOfficeProfile(JSON.stringify({ deskTone: 'sage', deskObject: 'books',
    plant: 'fern', petSpecies: 'cat', petName: 'Pixel', personalTouch: 'Livros e verde para pesquisa.' }));
  assert.equal(profile.petName, 'Pixel');
  assert.equal(parseOfficeProfile(JSON.stringify({ ...profile, petSpecies: 'dragon' })), null);
});

test('revisão visual direta não reinicia entrevistas e nomes de pets ficam distintos', () => {
  assert.equal(isVisualReviewRequest(normalize('Alfred, revise a cena do escritório e diga o que falta')), true);
  assert.equal(isVisualReviewRequest(normalize('Alfred, converse com cada integrante e personalize as mesas')), false);
  const profiles = uniquePetNames({ designer: { petName: 'Pixel' },
    trafego: { petName: 'Pixel', personalTouch: 'O gato Pixel ajuda no trabalho.' } });
  assert.equal(profiles.designer.petName, 'Pixel');
  assert.equal(profiles.trafego.petName, 'Cliques');
  assert.equal(profiles.trafego.personalTouch, 'O gato Cliques ajuda no trabalho.');
});
