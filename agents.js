// Perfis de trabalho da agência. Cada execução real usa um processo Codex CLI
// isolado e o mesmo login local da conta ChatGPT.
const TEAM_MEMBERS = {
  alfred: { name: 'Alfred', role: 'CEO / Gerência', zone: 'ceo', color: '#FF6B00',
    experience: 'Coordenação de projetos e definição de prioridades',
    skills: ['Planejamento', 'Briefing', 'Revisão de entregas'],
    tools: ['Codex CLI', 'Leitura local'], deliverable: 'Plano de ação e critérios de qualidade' },
  pesquisa: { name: 'Pesquisa', role: 'Pesquisador / Trend Hunter', zone: 'inteligencia', color: '#0EA5E9',
    experience: 'Pesquisa de público, tendências e pautas',
    skills: ['Investigação', 'Síntese', 'Hipóteses de conteúdo'],
    tools: ['Codex CLI', 'Leitura local'], deliverable: 'Resumo de pesquisa com fontes ou hipóteses identificadas' },
  copy: { name: 'Copy', role: 'Copywriter', zone: 'criacao', color: '#8B5CF6',
    experience: 'Redação persuasiva e conteúdo editorial',
    skills: ['Copywriting', 'Roteiros', 'Legendas'],
    tools: ['Codex CLI', 'Leitura local'], deliverable: 'Texto pronto para revisão' },
  designer: { name: 'Designer', role: 'Diretor de Arte', zone: 'criacao', color: '#E11D48',
    experience: 'Direção visual e composição de peças',
    skills: ['Conceito visual', 'Layout', 'Briefing criativo'],
    tools: ['Codex CLI', 'Canvas 2D', 'Edição visual isolada'], deliverable: 'Direção de arte e especificação visual' },
  social: { name: 'Social', role: 'Social Media', zone: 'distribuicao', color: '#F59E0B',
    experience: 'Calendário editorial e distribuição orgânica',
    skills: ['Planejamento de posts', 'Calendário', 'Adaptação por canal'],
    tools: ['Codex CLI', 'Leitura local'], deliverable: 'Plano de publicação para revisão' },
  trafego: { name: 'Tráfego', role: 'Gestor de Tráfego', zone: 'performance', color: '#10B981',
    experience: 'Estratégia de mídia paga e mensuração',
    skills: ['Estrutura de campanha', 'Segmentação', 'Métricas'],
    tools: ['Codex CLI', 'Leitura local'], deliverable: 'Plano de campanha sem publicação automática' },
  sdr: { name: 'SDR', role: 'Pré-Vendas', zone: 'comercial', color: '#14B8A6',
    experience: 'Qualificação e abordagem inicial de leads',
    skills: ['Qualificação', 'Abordagem', 'Follow-up'],
    tools: ['Codex CLI', 'Leitura local'], deliverable: 'Roteiro de prospecção para revisão' },
  closer: { name: 'Closer', role: 'Executivo de Contas', zone: 'comercial', color: '#6366F1',
    experience: 'Diagnóstico comercial e elaboração de propostas',
    skills: ['Negociação', 'Propostas', 'Objeções'],
    tools: ['Codex CLI', 'Leitura local'], deliverable: 'Proposta ou roteiro de reunião para revisão' },
  cs: { name: 'CS', role: 'Pós-Vendas', zone: 'comercial', color: '#EC4899',
    experience: 'Onboarding, suporte e retenção',
    skills: ['Acompanhamento', 'Suporte', 'Retenção'],
    tools: ['Codex CLI', 'Leitura local'], deliverable: 'Plano de atendimento para revisão' }
};

// Capacidade real e integrações desejadas ficam separadas. Uma integração
// listada como futura não concede acesso a contas externas.
const SPECIALIZATIONS = {
  alfred: { personality: 'Calmo, direto e responsável', skillFile: 'alfred',
    skillNames: ['marketing-plan', 'product-marketing'], capabilities: ['local-read'],
    plannedIntegrations: ['Quadro de projetos'] },
  pesquisa: { personality: 'Curioso, cético e preciso', skillFile: 'pesquisa',
    skillNames: ['customer-research', 'content-strategy'], capabilities: ['local-read'],
    plannedIntegrations: ['Busca web', 'Analytics'] },
  copy: { personality: 'Claro, empático e conciso', skillFile: 'copy',
    skillNames: ['copywriting', 'copy-editing'], capabilities: ['local-read'],
    plannedIntegrations: ['Documentos da marca'] },
  designer: { personality: 'Visual, pragmático e atento à legibilidade', skillFile: 'designer',
    skillNames: ['ad-creative', 'image'], capabilities: ['local-read', 'visual-write'],
    plannedIntegrations: ['Figma', 'Gerador de imagens'] },
  social: { personality: 'Próximo da comunidade e organizado', skillFile: 'social',
    skillNames: ['social', 'content-strategy'], capabilities: ['local-read'],
    plannedIntegrations: ['Instagram', 'LinkedIn', 'Agendador'] },
  trafego: { personality: 'Analítico e cuidadoso com orçamento', skillFile: 'trafego',
    skillNames: ['ads', 'conversion-tracking'], capabilities: ['local-read'],
    plannedIntegrations: ['Meta Ads', 'Google Ads', 'GA4'] },
  sdr: { personality: 'Investigativo e respeitoso', skillFile: 'sdr',
    skillNames: ['prospecting', 'revops', 'cold-email'], capabilities: ['local-read'],
    plannedIntegrations: ['CRM', 'Enriquecimento de leads'] },
  closer: { personality: 'Consultivo e transparente', skillFile: 'closer',
    skillNames: ['sales-enablement', 'offers'], capabilities: ['local-read'],
    plannedIntegrations: ['CRM', 'Calendário', 'Assinatura'] },
  cs: { personality: 'Paciente, proativo e honesto', skillFile: 'cs',
    skillNames: ['onboarding', 'churn-prevention'], capabilities: ['local-read'],
    plannedIntegrations: ['Helpdesk', 'CRM'] }
};
for (const [id, definition] of Object.entries(SPECIALIZATIONS)) {
  Object.assign(TEAM_MEMBERS[id], definition);
}

module.exports = { TEAM_MEMBERS };
