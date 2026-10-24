# Aplicação Next.js

O servidor público e o painel estão em `apps/web`, com Next.js App Router, React 19, TypeScript e Tailwind 4. `npm run build` gera os modelos do CMS e compila a aplicação com Webpack; `npm start` serve na porta 3000. O fallback `legacy:dev` não é necessário para o Next.

## Conteúdo e banco

Os Route Handlers de autenticação, sessão, conta, uploads, edição, publicação e lixeira usam Prisma 7.10.1 com adaptador MySQL/MariaDB. O código CJS legado fica disponível para importações/manutenção e testes antigos, sem encaminhamento de requisições do Next ao servidor antigo.

O painel permite edição de parágrafos por blocos com Tiptap, títulos, coleções ordenáveis e itens ocultos, além dos campos específicos de cada conteúdo. Configurações da conta usam uma tela própria. Confirmações internas usam o componente Modal; Escape e clique fora cancelam a ação. A confirmação nativa de saída/recarregamento do navegador continua sendo controlada pelo navegador.

As páginas públicas são renderizadas no servidor como elementos React a partir dos modelos do CMS. Os modelos de conteúdo e os scripts de interação existentes continuam presentes; não houve reescrita individual de todas as seções em componentes React independentes.

## URLs, pesquisa e arquivos

URLs públicas sem `.html`, com redirecionamento 308 dos endereços anteriores. A busca `/busca?q=` pesquisa conteúdo publicado, ignora acentos, prioriza títulos e filtra por tipo. Rascunhos e páginas ocultas não entram nos resultados.

Documentos e imagens importados ficam em `storage/documentos`, servidos pela rota `/assets/documentos/`. `institutional-assets.json` registra o mapeamento e o tamanho. Uploads novos ficam em `storage/uploads`, com leitura de compatibilidade em `dist/uploads`. **Preservar e fazer backup de `storage`, `dist/uploads` e MySQL ao implantar.** Essas pastas não são versionadas.

`url-aliases.json` relaciona os endereços anteriores às páginas locais. A geração e a renderização removem destinos de conteúdo do domínio antigo que não foram recuperados. Serviços externos independentes, como portal acadêmico, biblioteca e Google Maps, permanecem externos. A URL canônica de SEO usa `SITE_URL`, que deve ser o domínio de produção do novo site.

As páginas de documentos receberam cards, arquivos anuais e calendário com prévia local. Páginas de arquivos anuais sem documentos foram ocultadas e podem ser restauradas pelo administrador. A localização usa o iframe Google Maps fornecido pelo usuário. A 404 usa o cabeçalho e o rodapé públicos.

## Segurança e pendências externas

Não executar `prisma migrate reset` nem `db push` no banco existente. O schema foi introspectado sem recriar tabelas; alterações futuras exigem migração revisada e backup. As credenciais ficam em `.env.local`, ignorado pelo Git.

O painel é de usuário único. Não há gerenciamento de equipe, cadastro de usuários adicionais, recuperação nem troca de senha pela interface ou API. Alterações de senha são feitas diretamente no banco, preservando o formato de hash utilizado pela autenticação. As configurações da conta permitem alterar apenas o nome.

A seção Instagram está em modo manual, com quatro publicações selecionadas em 16/10/2026. Imagens locais e links podem ser editados pela coleção Instagram da página inicial. O modo manual não consulta a API do Instagram nem se atualiza automaticamente.

## Verificação

- `npm test`: regras de conteúdo, autenticação, URLs, cursos, editor, coleções, busca, apresentação e lixeira. Os testes da API Prisma usam banco apenas em memória.
- `TEST_BASE_URL=http://127.0.0.1:3000 npm run test:next:public`: percorre o sitemap, verifica status, links limpos, ausência de links de conteúdo para o domínio antigo, assets, SEO e 404.
- Testes autenticados contra MySQL real exigem banco exclusivo terminado em `_test`. Não criar contas de teste na base do administrador.
- O componente real de confirmação foi testado em uma interface isolada, sem autenticar ou publicar conteúdo real. O login, a busca e páginas públicas foram conferidos no navegador. A revisão visual completa do painel autenticado continua dependente de uma sessão do usuário.
