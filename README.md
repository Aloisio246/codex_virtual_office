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

Alfred coordena a equipe e revisa as entregas reais ao final de cada tarefa de marketing. O quadro mostra o trabalho dos especialistas e a revisão do gerente. Essas capacidades internas não dão acesso a contas externas nem permitem editar arquivos visuais. O pedido “pesquisar novamente o site da Impulso” aciona Pesquisa e consulta novamente o site público conhecido, mesmo sem repetir o URL. A consulta inclui trechos da página inicial, cinco páginas de serviços e a página “Sobre”, com os endereços das fontes. Ela não lê o conteúdo interno ou as métricas do Instagram.

Use “Personalizar equipe” no Menu ou peça a Alfred para entrevistar todos os integrantes. O Codex CLI coleta nove perfis criativos estruturados, Pesquisa sintetiza a base, Copy e Designer propõem a linguagem e Alfred revisa. Ao concluir, o Canvas aplica cores de mesa, objetos, plantas e pequenos animais virtuais. Os perfis ficam no volume `agency-data`; são escolhas ficcionais para a interface, não informações pessoais dos usuários.

Para pedir uma conferência da cena, escreva “Alfred, revise visualmente o escritório”. A página envia uma captura PNG do Canvas ao servidor local e o Codex CLI a recebe como imagem na revisão; Alfred compara a imagem com os perfis ativos. A captura fica no volume local `agency-data` como `office-preview.png`. A revisão requer a página aberta e o Codex CLI conectado. Os nomes dos postos aparecem nas mesas, e os nomes dos pets aparecem quando a equipe ocupa os postos.

Se você enviar o endereço do site da Impulso Ads enquanto uma tarefa de marketing estiver em andamento, a agência reinicia a tarefa preservando o pedido e os responsáveis. O servidor consulta o título, a descrição e o perfil do Instagram publicados nesse site e repassa esses dados aos agentes. Isso não inclui leitura de posts, métricas ou mensagens do Instagram. O comando “todos vão para suas cadeiras” move a equipe para os respectivos postos na cena.

O OpenAI Docs MCP é público e somente leitura. As integrações externas e seus acessos ficam para uma etapa posterior.

No Docker, o OpenAI Docs MCP é configurado automaticamente. O Playwright MCP é usado no Codex do host para testar a interface; ele não é necessário para as tarefas de marketing dentro do contêiner.
