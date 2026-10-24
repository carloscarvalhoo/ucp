# Testes automatizados

- `npm test`: Instagram, autenticação, segurança de edição de conteúdo e páginas completas dos cursos.
- `npm run test:integration`: teste HTTP/MySQL de primeiro acesso, autenticação, origem, rascunho, publicação, upload inválido e logout. Requer o servidor local na porta 3000 e banco ativos. Só executar antes do cadastro de um administrador real; o teste recusa um banco que já tem administradores. Os dados temporários são restaurados/removidos no finally.
- `npm run next:typecheck`: TypeScript da base Next.
- `npm run next:build`: build de produção da base Next. Ainda não comprova migração do site inteiro para Next.
- `npm run format:check`: Prettier.
- `npm run build` e `npm run check`: geração do protótipo, assets e âncoras da página inicial.

Também foi executado teste de integração dos novos cadastros (curso com página e card, banner e notícia com listagem), removendo os registros de teste. Esse cenário precisa ser incorporado à suíte permanente da aplicação Next durante a migração.

Testes de viewport no navegador integrado verificaram 390×844, navegação de curso, aba antiga antes de sua remoção e ausência de rolagem lateral. Não equivalem a um teste em Safari de um iPhone físico. As páginas de curso agora exibem todas as seções sem abas.

A suíte ainda não cobre toda a responsividade, recuperação de senha, permissões de múltiplos papéis, concorrência de publicação, restauração de backup, API Instagram real, leitura integral de PDFs ou toda a migração Next. Esses pontos não devem ser anunciados como concluídos.
