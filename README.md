# Codex Virtual Agency

Escritório local para nove agentes, com chat, voz, quadro de tarefas e execução pelo Codex CLI. Sem conexão com o CLI, o chat usa uma demonstração identificada como simulação. As contas de marketing externas ainda não estão conectadas.

## Docker Desktop

1. Abra o Docker Desktop e aguarde o mecanismo Linux ficar pronto.
2. No PowerShell, nesta pasta, rode `docker compose up --build -d`.
3. Abra `http://localhost:3000`.
4. Consulte os logs com `docker compose logs -f agency`.
5. Encerre com `docker compose down`. O volume `agency-data` preserva conversas e tarefas.

O Compose monta somente `~/.codex/auth.json` em modo de leitura e copia o login para a configuração isolada do Codex no contêiner. Faça `codex login` no host antes de iniciar. Esse arquivo contém credenciais; use esta configuração apenas no seu computador. Se o login expirar, renove-o no host e recrie o contêiner. Para usar apenas a demonstração sem login, remova a montagem de `auth.json` do Compose.

## Execução local

Rode `npm install` e `npm start`. O servidor fica em `http://localhost:3000`. `npm run watch` observa arquivos da pasta atual e envia eventos à agência. O histórico é salvo em `agency-state.json` fora da pasta pública.

## Funções

Os perfis e permissões atuais estão em `agents.js`; as nove instruções de trabalho ficam em `agent-skills/`. As tarefas reais executam o Codex CLI. Apenas o Designer pode modificar os arquivos visuais, em uma cópia temporária validada antes de aplicar. As demais tarefas entregam texto para revisão no chat e no quadro.

O OpenAI Docs MCP é público e somente leitura. As integrações externas e seus acessos ficam para uma etapa posterior.

No Docker, o OpenAI Docs MCP é configurado automaticamente. O Playwright MCP é usado no Codex do host para testar a interface; ele não é necessário para as tarefas de marketing dentro do contêiner.
