# Skills da Codex Virtual Agency

Estas nove skills são adaptações curtas, em português, do repositório MIT
[coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills).
Os arquivos de origem permanecem no GitHub; as referências de cada papel
aparecem no respectivo `SKILL.md`. O servidor carrega a skill da função no
prompt de cada processo Codex CLI.

| Agente | Skills de referência | Trabalho atual |
| --- | --- | --- |
| Alfred | marketing-plan, product-marketing | Planejar, delegar e revisar |
| Pesquisa | customer-research, content-strategy | Investigar e priorizar pautas |
| Copy | copywriting, copy-editing | Redigir e revisar texto |
| Designer | ad-creative, image | Direção visual e edição isolada do Canvas |
| Social | social, content-strategy | Adaptar posts e calendário |
| Tráfego | ads, conversion-tracking | Planejar mídia e mensuração |
| SDR | prospecting, revops, cold-email | Qualificar e preparar abordagem |
| Closer | sales-enablement, offers | Diagnóstico e proposta |
| CS | onboarding, churn-prevention | Acompanhamento e retenção |

## Permissões efetivas

- Todos executam Codex CLI com sandbox `read-only` nas tarefas de marketing.
- Apenas o Designer usa `workspace-write` no fluxo de alteração visual. Ele
  trabalha em uma cópia temporária; o servidor valida e publica somente
  `public/app.js` e `public/index.html`.
- Nenhuma conta de anúncios, rede social, CRM, helpdesk ou gerador de imagens
  está conectada ao projeto. Essas ferramentas aparecem na interface como
  **integrações futuras**, sem prometer execução real.

As skills são instruções de trabalho, não credenciais nem conectores. Para
operar plataformas externas, a próxima etapa é ligar cada serviço com
permissões específicas e mostrar seu estado na interface.
