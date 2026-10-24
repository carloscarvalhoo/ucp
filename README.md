# Novo site UCP — versão com estrutura da Campo Real

Site estático responsivo com a ordem de seções e o padrão visual da página inicial da Campo Real, adaptados à identidade e ao conteúdo da UCP. A versão anterior foi preservada em `versions/v1`.

## Abrir

O site ativo roda em Next.js, em `apps/web` (App Router, Prisma + MySQL/MariaDB). Admin em `/admin`.

1. `npm install` na raiz e em `apps/web`.
2. Suba um MySQL local apontado pelas variáveis de `.env.local` (host/porta/usuário/senha).
3. Na raiz: `npm run dev` (atalho para `npm --prefix apps/web run dev`), depois visite http://127.0.0.1:3000.

O antigo gerador estático (`build.cjs` → `dist/`) e o CMS legado em `admin/`/`server.cjs` foram removidos; `build.cjs` continua existindo apenas para regenerar o conteúdo migrado em `content-source.json` quando necessário (`npm run content:build`).

## Incluído

- Cabeçalho em duas faixas: marca, busca, modal de login com opções professor/aluno e sete grupos de navegação com submenus.
- Banner com três destaques e controles manuais; carrossel com os nove atalhos acadêmicos da estrutura de referência.
- Chamada institucional e vídeo oficial em janela, carregado somente após o clique.
- Carrossel de nove cursos, fotos, duração, turno, diploma, filtros e busca sem distinção de acentos. Informações acadêmicas conferidas nas páginas oficiais.
- Indicadores com informações confirmadas, galeria de seis fotos com miniaturas, controles e ampliação.
- Três notícias reais com imagens e links para as matérias oficiais.
- Projetos e incentivos: bolsas, CPA, ouvidoria e apoio acadêmico.
- Carrossel de espaços para a comunidade.
- Feed preparado para os cinco posts mais recentes do Instagram, atualizado a cada cinco minutos. A ativação depende da autorização da conta profissional; veja INSTAGRAM.md.
- Bloco de vídeos com vídeo institucional, Reels e Facebook. Substitui o TikTok porque o usuário confirmou que a UCP não possui perfil.
- Rodapé em cinco grupos, contato, redes sociais, privacidade, endereço e acesso ao e-MEC.
- Navegação por teclado e adaptação para celular.

## Editar e gerar

`build.cjs` gera `dist/index.html` e `dist/site-data.js` a partir de `content-source.json` e `official-links.json`. Execute `node build.cjs` após editar os dados ou a estrutura. Os arquivos ativos de estilo e comportamento são `dist/campo.css` e `dist/campo.js`.

## Conteúdo e publicação

Conteúdo consultado em 15/10/2026 nos sites ucpparana.edu.br e guarapuava.camporeal.edu.br. As fotos de estrutura são arquivos públicos da UCP e podem ser históricas. A marca tipográfica do cabeçalho é provisória; substituir pelo arquivo vetorial aprovado antes de produção. O banner ativo é o arquivo institucional `BANNER-UCP.png`, publicado em setembro de 2026. A peça histórica `assets/hero.jpeg` não é utilizada.

Antes de publicar oficialmente, validar marca, autorização de uso das imagens, catálogo completo (incluindo Smart Premium), regras comerciais e os destinos de inscrição. Preços e percentuais de descontos não foram reproduzidos devido às divergências encontradas nas fontes.

Os links oficiais de serviços são extraídos para `official-links.json` durante o desenvolvimento e incorporados ao HTML. O site não altera o domínio ou o site atual da UCP. Hospedagem Sites indisponível nesta sessão; esta entrega é local.



## Migração das páginas internas — 16/10/2026

Foram geradas 13 páginas de cursos (9 presenciais e 4 Smart), 18 guias institucionais, 14 de Utilidades e dois índices. O modelo reutilizável está em `render-pages.cjs`; os textos, docentes, preços e documentos vêm das páginas antigas arquivadas em `sources/`. O inventário está em `MIGRACAO.md`. Documentos permanecem nos links oficiais, formulários/serviços externos apontam para a origem e COLAP está sem conteúdo na fonte.

Para reconstruir após alterar a importação: `node import-content.cjs` e depois `node build.cjs`. Os scripts de transformação pontual `integrate-pages.cjs` e `material-update.cjs` já cumpriram seu papel e foram arquivados em `scripts/migration-archive/` — não executar novamente.

A guia Alunos foi retirada do menu principal. O favicon foi copiado do site original; os ícones usam Google Material Icons Outlined, o vermelho principal é #FF2950 e a barra de rolagem foi personalizada. A marca tipográfica do cabeçalho continua provisória.

## Animações, cookies e rolagem

GSAP 3.15.0 e ScrollTrigger instalados via npm, com versões fixadas em `package-lock.json`. `npm install` prepara as dependências e `npm run build` copia os arquivos de distribuição para `dist/vendor` e inclui a camada `animations.js` em todas as páginas. As animações respeitam `prefers-reduced-motion`; nenhum conteúdo depende delas para aparecer.

O aviso em `cookies.js` permite aceitar todos, somente necessários ou personalizar mídia externa. A escolha é guardada no localStorage por até 180 dias e pode ser revista pelo rodapé. Vídeos do YouTube aguardam permissão para mídia externa. Não há ferramentas de publicidade ou analytics nesta versão. Google Fonts e imagens do Instagram, quando o feed estiver autorizado, são recursos externos já descritos no aviso de privacidade da página; não são bloqueados por essa preferência de vídeo.

A barra de rolagem tem largura de 16 px no Chromium e usa #FF2950. Navegadores com barras sobrepostas podem respeitar as configurações do sistema.


## Páginas complementares — 16/10/2026
48 rotas importadas a partir das evidências públicas da auditoria: Pós-Graduação (somente apresentação e consulta de oferta), Contato e atendimento, Extensão, CPA, Revistas UCP, ALCP e Eventos históricos. Conteúdo em additional-pages.json; importador import-additional.cjs; renderização render-additional.cjs. Notícias e Blog não recebem o histórico antigo. Formulário de contato e documentos continuam externos. O importador omite páginas de teste/vazias da pós-graduação.
