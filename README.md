# Codex Virtual Agency

Escritório local para nove agentes, com chat, voz, quadro de tarefas e execução pelo Codex CLI. Sem conexão com o CLI, o chat usa uma demonstração identificada como simulação. As contas de marketing externas ainda não estão conectadas.

## Docker Desktop

1. Abra o Docker Desktop e aguarde o mecanismo Linux ficar pronto.
2. No PowerShell, nesta pasta, rode `docker compose up --build -d`.
3. Abra `http://localhost:3000`.
4. Consulte os logs com `docker compose logs -f agency`.
5. Encerre com `docker compose down`. O volume `agency-data` preserva conversas e tarefas.

O Compose monta a pasta local `~/.codex` no contêiner para reutilizar o login existente do Codex CLI. Esse diretório contém credenciais; use esta configuração apenas no seu computador. Se a conexão não aparecer no menu, faça `codex login` no host e recrie o contêiner. O servidor continua funcional em modo de demonstração sem login.

## Execução local

Rode `npm install` e `npm start`. O servidor fica em `http://localhost:3000`. `npm run watch` observa arquivos da pasta atual e envia eventos à agência. O histórico é salvo em `agency-state.json` fora da pasta pública.

## Funções

Os perfis e permissões atuais estão em `agents.js`; as nove instruções de trabalho ficam em `agent-skills/`. As tarefas reais executam o Codex CLI. Apenas o Designer pode modificar os arquivos visuais, em uma cópia temporária validada antes de aplicar. As demais tarefas entregam texto para revisão no chat e no quadro.

O OpenAI Docs MCP é público e somente leitura. As integrações externas e seus acessos ficam para uma etapa posterior.
