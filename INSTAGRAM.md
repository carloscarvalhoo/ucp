# Instagram

A seção "Instagram" da página inicial tem três modos, trocados no painel em
**Página inicial → Instagram**:

- **Posts manuais** — até 4 publicações escolhidas à mão pelo administrador (título,
  imagem e link). Não se atualiza sozinha; é a opção usada hoje em produção.
- **Automático** — o site busca sozinho, a cada poucos minutos, os 5 posts mais
  recentes de @ucpparana. Não precisa de login nem de token: lê a página pública
  de embed do Instagram (`https://www.instagram.com/<usuário>/embed/`), a mesma
  usada por sites de notícia para embutir posts. Implementado em `instagram.cjs`
  e servido por `/api/instagram`. Configurável via `INSTAGRAM_USERNAME` em
  `.env.local` (padrão `ucpparana`).
  **Risco:** é uma raspagem não-oficial da página pública, fora dos Termos de Uso
  do Instagram. Se a Meta mudar o HTML/formato dessa página, a extração pode
  parar de funcionar até alguém ajustar o parser em `instagram.cjs` — o site não
  quebra (volta a mostrar o último feed salvo em cache e depois um estado vazio),
  mas o feed para de atualizar.
- **Widget externo** — embute um iframe de um serviço como LightWidget, Elfsight
  ou SnapWidget (URL colada no painel). Eles resolvem a autenticação oficial do
  lado deles; normalmente têm plano gratuito com uma marca d'água discreta.

`instagram-manual.json` fornece os valores iniciais do modo manual. Edições salvas
pelo administrador no CMS são preservadas entre os modos.
