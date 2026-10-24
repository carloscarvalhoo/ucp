> Atualização em 16/10/2026: o runtime público e o painel agora executam no Next.js. Este documento registra também decisões e estágios anteriores. Consulte MIGRACAO-NEXT.md para o estado implementado, testes e limitações atuais.

# Decisão de arquitetura — aprovada em 16/10/2026

## Stack de destino

- Next.js App Router com React e TypeScript.
- Tailwind CSS para componentes e tokens visuais; GSAP/ScrollTrigger para animações.
- MySQL existente. Camada de persistência isolada dos componentes; avaliar introspecção Prisma antes de alterar o esquema.
- Prettier instalado no projeto; o suporte CSS é nativo. Configuração em .prettierrc.json.

## Motivo

O escopo passou de um site institucional estático para um sistema editorial com autenticação, arquivos, rascunhos, prévias, publicação e cadastros. O servidor e o painel em Node/HTML atuais são uma implementação transitória, não a arquitetura final.

Layouts compartilhados do Next devem manter o header entre as navegações. Componentes do servidor acessam conteúdo publicado; componentes do cliente ficam restritos a formulários e interações. O acesso administrativo é separado do Portal acadêmico.

## Migração

1. Preservar o protótipo e o banco atual, criar a base Next/Tailwind/TypeScript com verificação de tipos e build.
2. Converter header, footer, busca e componentes de navegação; definir URLs sem .html e redirecionamentos.
3. Migrar página inicial, catálogo, páginas de cursos e conteúdo institucional; verificar em 390×844 e desktop.
4. Migrar administração para componentes React e validações de servidor. Usar autenticação mantida por biblioteca, em vez de ampliar o sistema artesanal.
5. Consolidar as entidades: curso único alimenta menu, card e página; banner ordenável alimenta hero. Remover duplicação entre cards e páginas.
6. Testar autenticação, permissões, arquivos, rascunho, prévia, publicação, novos cadastros e redirecionamentos antes da troca na porta 3000.

## Permissões do administrador

Conteúdo e cadastros são editáveis; layout, código, fontes e animações permanecem protegidos. Cores principais podem ser uma configuração específica para administrador, com prévia, sem liberar edição arbitrária de CSS. Essa configuração de cores ainda não está implementada.

## Matriz de conteúdo

| Área | Editar | Novo cadastro | Situação transitória |
|---|---|---|---|
| Hero | Foto, descrição, destino | Banner | API e formulário criados; validação integral pendente |
| Cursos | Textos, imagens, informações, documentos | Curso | API e formulário criados; consolidação de entidade e validação pendentes |
| Institucional/Utilidades | Textos, imagens, links e documentos por seção | Nova página/guia | Edição preparada; cadastro de página/guia pendente |
| Notícias/Blog/Eventos | Conteúdo e documentos | Publicação | API e formulário criados; validação integral pendente |
| Documentos | Título, arquivo, vínculo com seção | Upload PDF | Upload e vínculo preparados; versionamento de arquivo pendente |
| Galeria | Fotos e descrições | Novas fotos e ordenação | Edição preparada; inclusão/ordenação pendentes |
| Acessos rápidos/Projetos/Comunidade | Textos, fotos e destinos | Novos cards e ordenação | Edição preparada; cadastro/ordenação pendentes |
| Header/Footer | Textos e destinos | Links/menus | Edição preparada; estrutura de menu unificada pendente |
| Redes/Contato | Rótulos e links existentes | Novos canais | Edição parcial; WhatsApp precisa de número oficial |
| Identidade | Cor principal e logo | — | Logo editável; cores ainda pendentes |
| Equipe administrativa | Dados e permissões | Usuário/editor | Primeiro acesso preparado; gestão e recuperação pendentes |
| Instagram | Credenciais de integração no servidor | — | Sem credenciais configuradas |

## URLs propostas

Hoje as páginas usam .html, por exemplo /cursos/administracao.html. Proposta: /cursos/administracao/, /institucional/, /utilidades/, /pos-graduacao/, /noticias/, /blog/, /eventos/ e /admin/. A troca deve preservar redirecionamentos dos endereços existentes; ainda não foi aplicada.

## Situação real

Next e Tailwind são a arquitetura aprovada de destino, não uma migração concluída. O relatório ARQUITETURA.md descreve o estágio Node transitório. Nenhum painel deve ser anunciado como pronto para produção antes dos critérios e testes acima.
