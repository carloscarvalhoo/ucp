import Link from 'next/link';
import { getPublicPage } from '@/lib/public-content';
import { searchSite } from '@/lib/site-search';
import { parseHTML } from '@/lib/content-domain';
import { ContentTree } from '@/components/content-tree';
import { SiteRuntime } from '@/components/site-runtime';
import './search.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Busca | UCP', robots: { index: false, follow: true } };
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>;
}) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 150) : '';
  const type = typeof params.tipo === 'string' ? params.tipo : '';
  const [shell, results] = await Promise.all([getPublicPage('/noticias'), searchSite(query)]);
  const { document } = parseHTML('<html><body>' + shell.html + '</body></html>');
  const marker = document.createElement('div');
  marker.id = 'search-content-slot';
  document.querySelector('main')?.replaceWith(marker);
  for (const input of document.querySelectorAll('.site-search input'))
    input.setAttribute('value', query);
  const [before, after] = document.body.innerHTML.split('<div id="search-content-slot"></div>');
  const types = Array.from(new Set(results.map((item) => item.type)));
  const visible = type ? results.filter((item) => item.type === type) : results;
  const pageURL = (value: string) =>
    '/busca?' + new URLSearchParams({ q: query, ...(value ? { tipo: value } : {}) });
  return (
    <div className="public-site">
      {shell.styles.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <ContentTree html={before} />
      <main id="conteudo" className="ucp-search wrap">
        <nav aria-label="Você está em">
          <Link href="/">Início</Link>
          <span aria-hidden="true"> / </span>Busca
        </nav>
        <p className="search-eyebrow">ENCONTRE NA UCP</p>
        <h1>O que você procura?</h1>
        <p className="search-intro">Cursos, serviços e informações para facilitar seu dia.</p>
        <form action="/busca" method="get" role="search" className="results-search">
          <label htmlFor="results-query">Buscar no site</label>
          <div>
            <input
              id="results-query"
              name="q"
              type="search"
              maxLength={150}
              defaultValue={query}
              placeholder="Digite o que você está procurando"
              required
            />
            <button type="submit">
              Buscar <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>
        {query && (
          <>
            <h2 className="search-summary">
              {results.length
                ? `${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`
                : 'Nenhum resultado'}{' '}
              para “{query}”
            </h2>
            {types.length > 1 && (
              <nav className="search-filters" aria-label="Filtrar resultados por tipo">
                <a href={pageURL('')} aria-current={!type ? 'page' : undefined}>
                  Todos ({results.length})
                </a>
                {types.map((value) => (
                  <a
                    key={value}
                    href={pageURL(value)}
                    aria-current={type === value ? 'page' : undefined}
                  >
                    {value} ({results.filter((item) => item.type === value).length})
                  </a>
                ))}
              </nav>
            )}
            <div className="search-results">
              {visible.map((item) => (
                <article key={item.url}>
                  <span className="search-type">{item.type}</span>
                  <h2>
                    <a href={item.url}>
                      {item.title}
                      <span aria-hidden="true">↗</span>
                    </a>
                  </h2>
                  <p>{item.excerpt}</p>
                  <a className="search-open" href={item.url}>
                    Acessar {item.type === 'Curso' ? 'curso' : 'página'}{' '}
                    <span aria-hidden="true">→</span>
                  </a>
                </article>
              ))}
            </div>
            {!visible.length && (
              <div className="search-empty">
                <h2>Vamos tentar de outro jeito?</h2>
                <p>
                  Confira a escrita ou use termos mais simples, como “Administração”, “biblioteca”
                  ou “calendário”.
                </p>
                <Link href="/cursos">Conhecer os cursos →</Link>
              </div>
            )}
          </>
        )}
        {!query && (
          <div className="search-empty">
            <h2>Seu próximo caminho começa com uma busca.</h2>
            <p>Digite acima o nome de um curso, serviço ou assunto.</p>
          </div>
        )}
      </main>
      <ContentTree html={after || ''} />
      <SiteRuntime scripts={shell.scripts} />
    </div>
  );
}
