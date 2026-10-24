# Notícias, blog e eventos

O formulário de criação e o editor permitem adicionar e ordenar blocos de texto formatado, títulos, seções com subtítulos, imagens, galerias, botões com links e documentos PDF. Imagens podem ser enviadas ou informadas por endereço. Galerias aceitam várias fotos por envio, além de URLs individuais. PDFs enviados têm limite de 10 MB.

A data escolhida é salva no rascunho e só passa a definir a ordem da listagem após publicar. Publicar novamente sem alterar a data preserva a posição anterior. Alterar a data para uma mais recente coloca a publicação antes das antigas. Não é um agendador de publicação.

Os blocos ficam em publicationBlocks no JSON de conteúdo, com HTML sanitizado gerado no servidor. O HTML dos blocos não é exposto novamente como campos individuais. Conteúdo antigo continua editável nos grupos de texto existentes. Revisões, prévia, desfazer e publicação explícita são mantidos.

# Cursos

O menu Cursos abre /cursos, com as graduações presenciais da UCP. /cursos-smart lista separadamente os cursos da Campo Real, com a UCP identificada como polo. O filtro Smart na página inicial também mantém a separação.

A jornada apresenta o curso e as possibilidades profissionais antes da mensalidade. Mensalidade e incentivos ficam próximos e abertos. Sobre o curso, diferenciais e possibilidades profissionais, coordenação e corpo docente com fotos ficam abertos. O corpo docente usa carrossel de três cards no computador, dois em telas intermediárias e um no celular, com setas, toque e teclado. Os tópicos complementares são renderizados como details/summary fechados no final do conteúdo, acessíveis por teclado e sem depender de JavaScript. As fotos dos professores foram associadas pela ordem dos sliders das páginas de origem da UCP e armazenadas localmente; teacher-photos-report.json registra o resultado.

Os ajustes de apresentação são aplicados na renderização, preservando os rascunhos e as edições já existentes no banco. Não é necessário executar seed.

O editor de publicações possui paleta de componentes, reordenação por arrastar ou botões, seleção do bloco pela prévia e visualização de computador/celular. A prévia visual é isolada de links executáveis; o servidor continua sanitizando a versão publicada.

Em 16/10/2026, os nove eventos históricos importados foram movidos à lixeira a pedido do usuário. Notícias, Blog e Eventos começaram sem registros ativos. O script de migração conferiu IDs e revisões e preservou backup privado.

A criação de notícias, blog e eventos abre como tela do admin, com botão para voltar à listagem. Não usa modal. Ao voltar ou trocar de área com alterações, a confirmação de descarte continua ativa. Depois de criar o rascunho, o editor abre o novo conteúdo sem perguntar novamente se deve descartar o formulário já salvo.

Na criação, título, tipo, data e endereço opcional ficam na área de dados básicos, a capa fica em painel recolhível, e o botão de criar rascunho permanece acessível no rodapé do formulário. O editor mantém histórico de até 50 alterações de blocos, com desfazer/refazer e duplicação de componentes.

As áreas de páginas usam uma lista direta, sem pastas técnicas duplicadas com a página principal. O editor reúne textos, imagens e links, com filtro opcional por parte da página quando há mais de um grupo. Documentos/PDFs ficam em painel recolhível; coleções e o editor visual de publicações são preservados.
