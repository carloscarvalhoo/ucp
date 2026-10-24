# Relatório de auditoria e migração — UCP

Conferência técnica realizada em 16/10/2026. Início: 2026-10-16T11:51:42.823Z; fim: 2026-10-16T11:55:50.859Z.

## Decisão de escopo

**O histórico de Notícias e Blog não será importado, por decisão expressa do usuário.** As duas áreas permanecem no novo site para novas publicações, com páginas próprias e acesso pelo menu. O inventário preserva os registros históricos para rastreabilidade. Eventos é uma área separada: listagem e nove registros históricos foram gerados, com identificação explícita de acervo.

## Cobertura comprovada

- 39 sitemaps consultados; 3838 endereços de páginas requisitados. Isso inclui aliases, arquivos e paginações: não representa a mesma quantidade de páginas únicas de conteúdo.
- 3779 endereços de documentos verificados por HTTP e início do arquivo. Resultados: available: 3729; http_error: 50.
- 25814 páginas de anexos inventariadas pelos sitemaps, sem acesso individual a todas elas.
- A API de mídia informa 3767 registros, mas entregou 3645; diferença de 122. A consulta complementar em ordem inversa retornou os mesmos IDs. A causa dessa divergência permanece sem confirmação.
- Consulta REST complementar: 954 registros de posts e 190 de páginas obtidos. Esse inventário complementa o sitemap de posts, que retornou HTTP 500; não comprova leitura individual integral de cada registro REST.

## Situação do novo site

- 13 páginas de cursos geradas, incluindo os quatro cursos Smart.
- 32 guias de Institucional e Utilidades geradas, mais os respectivos índices. A planilha migracao.csv identifica cada rota e confirma a existência do arquivo.
- Documentos continuam referenciados por links externos. Eles não foram todos copiados para a hospedagem nova; o funcionamento desses links depende dos serviços de origem.
- A guia COLAP exige revisão: a origem importada não ofereceu conteúdo útil. Não foi criado texto para preencher essa lacuna.
- Formulários, autenticação e serviços incorporados dependem dos sistemas oficiais; não houve teste funcional completo com login ou envio de dados.
- A integração automática dos cinco posts do Instagram ainda depende de credenciais válidas no servidor. A existência da interface não confirma conexão ativa.
- Notícias e Blog: áreas mantidas para novas publicações; histórico antigo excluído intencionalmente. Eventos: listagem e registros históricos gerados. Mais 48 rotas foram geradas para Pós-Graduação, Atendimento, Extensão, CPA, Revistas, ALCP e Eventos; documentos continuam externos. Demais páginas antigas fora das rotas detalhadas não devem ser consideradas migradas só por constarem do inventário.

## Ocorrências que precisam de conferência

9 páginas tiveram HTTP diferente de 200, erro de rede ou indicação de página inexistente. 50 documentos não passaram pela verificação de disponibilidade. Consulte pendencias-http.csv para a relação completa e páginas/documentos.csv para contexto. Os resultados retratam o momento da consulta e não provam falha permanente.

Exemplos de páginas com ocorrência:
- https://ucpparana.edu.br/vestibular-inverno/ — HTTP 500
- https://ucpparana.edu.br/vestibular/ — HTTP 500
- https://ucpparana.edu.br/bolsas-incentivos.php — HTTP 404
- https://ucpparana.edu.br/blog/?paged=2 — HTTP 404
- https://ucpparana.edu.br/blog/?paged=6 — HTTP 404
- https://ucpparana.edu.br/blog/?paged=3 — HTTP 404
- https://ucpparana.edu.br/eventos/?paged=2 — HTTP 404
- https://ucpparana.edu.br/vestibular/%3C!DOCTYPE%20html%3E%3Chtml%20lang= — HTTP 404
- https://ucpparana.edu.br/vestibular — HTTP 500

## Limites da confirmação

Esta é uma auditoria de inventário público e disponibilidade técnica, **não uma confirmação de leitura integral de cada documento**. Foram inspecionados os primeiros bytes dos arquivos, não todas as páginas dos PDFs, sua integridade completa ou validade acadêmica/jurídica. Arquivos privados, não vinculados ou não expostos pela API e pelos sitemaps podem não estar neste levantamento. Imagens e páginas de anexos não foram verificadas individualmente. Também não foi feita comparação semântica palavra por palavra de todo o site antigo contra o novo.

Portanto, ainda não é correto afirmar que “tudo foi migrado”. O conjunto de cursos, guias e 48 páginas complementares está gerado; os itens pendentes, dependências externas e exclusões estão identificados acima.

## Arquivos de evidência

- paginas.csv: todos os endereços consultados, HTTP, títulos e referência à evidência HTML compactada.
- documentos.csv: cada documento, disponibilidade, tipo e páginas que o referenciam.
- migracao.csv: rotas do novo site e existência dos arquivos.
- pendencias-http.csv: ocorrências que precisam de revisão.
- page-results.jsonl e document-results.jsonl: resultados brutos com data de consulta.
- attachment-pages-inventory.json e media-inventory.json: inventários de anexos e mídia.
- rest-pages.json: inventário REST complementar de posts e páginas.
