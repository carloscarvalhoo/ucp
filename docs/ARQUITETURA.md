> Atualização em 16/10/2026: o runtime público e o painel agora executam no Next.js. Este documento registra também decisões e estágios anteriores. Consulte MIGRACAO-NEXT.md para o estado implementado, testes e limitações atuais.

# Arquitetura UCP — revisão de 16/10/2026

## Decisões

O sistema será um monólito modular Node.js, com MySQL, site público e administração no mesmo servidor. Não há necessidade atual de microsserviços. O painel gerencia conteúdo; não oferece alterações de CSS, layout, fontes, cores ou animações.

O fluxo editorial é: escolher área → seção → editar conteúdo → salvar rascunho → conferir → publicar. O Portal acadêmico e o login administrativo são serviços distintos.

## Estrutura atual

- `src/styles`: CSS-fonte ativo; `src/client`: comportamento e animações do site. Editar aqui, não em dist.
- `public/assets`: imagens estáticas utilizadas no site. Copiadas durante o build.
- `admin`: interface administrativa independente do site público.
- `cms/db.cjs`: pool MySQL; `cms/auth.cjs`: senha e sessão; `cms/content.cjs`: conteúdo e renderização; `cms/routes.cjs`: API protegida.
- `database/schema.sql`: versão inicial das tabelas. `database-bootstrap.cjs`: criação local, sem sobrescrever credenciais existentes.
- `build.cjs`, `render-pages.cjs`, `render-additional.cjs`: templates e geração do site institucional.
- `dist`: resultado gerado. Uploads em dist/uploads estão fora do Git e não são removidos pelo build atual.
- JSONs de importação, sources e audit-2026-10-16: evidências/migração, separados conceitualmente do conteúdo editorial no MySQL.

## Dados e publicação

`content_entries` guarda rascunho e versão publicada por seção. O administrador altera valores de campos, sem receber acesso de edição ao template. Textos são atribuídos com textContent; imagens e links têm protocolos validados. `content_revisions` registra rascunhos; `audit_events`, publicações. `media_assets` identifica arquivos enviados. `admin_users` e `admin_sessions` são independentes do acesso acadêmico. Configurações e menus têm tabelas preparadas para evolução.

A base gerada fornece o template; as versões publicadas no MySQL são aplicadas ao servir a página. Assim um build não sobrescreve o conteúdo publicado pelo painel. Campos dos cards e da galeria também podem ser fornecidos ao JavaScript pelo banco.

## O que foi corrigido nesta etapa

1. Arquivos-fonte ativos passaram a existir fora de dist; o build copia CSS, JavaScript e imagens.
2. Banco ucp_site criado na instância local exclusiva, 127.0.0.1:3307. Usuário da aplicação tem SELECT/INSERT/UPDATE/DELETE; credenciais em .env.local. Credencial administrativa privada em .cms-private, fora da área pública e do Git.
3. Login administrativo usa scrypt com sal aleatório; sessões opacas, armazenadas como hash, com expiração. Escritas exigem mesma origem. Primeiro administrador é cadastrado uma única vez no servidor local. Não existe senha padrão.
4. Uploads aceitam JPG/PNG/WebP/PDF por assinatura, com nomes aleatórios e limite de 10 MB. SVG/HTML/executáveis não são aceitos.
5. O pipeline de importação não é o painel: conteúdo antigo permanece como evidência. Notícias e Blog não recebem o histórico antigo.

## Limites e próximos ajustes

- A publicação de novas Notícias/Blog/Eventos, recuperação de senha, gestão de usuários e restauração de revisão precisam de fluxos completos antes de considerarmos o CMS finalizado.
- Templates existentes e o mapeamento de campos precisam ser estabilizados; alterações estruturais de template exigem migração explícita dos campos, não um novo seed sobre o conteúdo publicado.
- Há duplicação entre informações de cards e páginas de cursos. Evoluir para uma entidade de curso compartilhada evita ter de atualizar ambos.
- A busca pública ainda é restrita ao catálogo de cursos; uma busca global requer índice de páginas e documentos.
- O servidor local depende do MySQL ativo. Antes de produção: migrações versionadas incrementais, configuração HTTPS, validação de permissões editor/administrador, recuperação de acesso, backups e teste de restauração, publicação/arquivamento de novos registros, testes de concorrência e uploads.
- A instância MySQL de desenvolvimento está na pasta local do projeto, sob OneDrive. Em produção os dados e uploads devem ficar em volumes dedicados, fora da sincronização e da pasta do build. Não sincronizar/copiar os arquivos físicos do MySQL enquanto estiver ativo; usar backup lógico.
- Uploads precisam migrar de dist/uploads para armazenamento persistente independente antes de adotar builds que limpam dist.
- Revisão semântica dos documentos e pendências da auditoria continuam separadas da arquitetura do software.

## Critérios de conclusão do painel

O painel só estará completo quando todos os tipos de conteúdo puderem ser criados/alterados com campos compreensíveis, os fluxos acima passarem em testes, as alterações aparecerem na área pública e o administrador conseguir recuperar acesso e versões sem intervenção no código.
