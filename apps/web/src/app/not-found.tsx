import Link from 'next/link';
import { connection } from 'next/server';
import { getPublicPage } from '@/lib/public-content';
import { parseHTML } from '@/lib/content-domain';
import { ContentTree } from '@/components/content-tree';
import { SiteRuntime } from '@/components/site-runtime';
export default async function NotFound() {
  await connection();
  const shell = await getPublicPage('/');
  const { document } = parseHTML('<html><body>' + shell.html + '</body></html>');
  const marker = document.createElement('div');
  marker.id = 'not-found-slot';
  document.querySelector('main')?.replaceWith(marker);
  const [before, after] = document.body.innerHTML.split('<div id="not-found-slot"></div>');
  return (
    <div className="public-site">
      {shell.styles.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <ContentTree html={before} />
      <main id="conteudo" className="flex flex-col bg-white px-6 py-8 text-[#272c34]">
        <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 py-16 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <p className="mb-4 text-xs font-semibold tracking-[.18em] text-ucp">
              PÁGINA NÃO ENCONTRADA
            </p>
            <h1 className="max-w-lg text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Opa! Essa página
              <br />
              não está por aqui.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-gray-600">
              Talvez o endereço tenha mudado, mas a gente ajuda você a encontrar o caminho. Que tal
              voltar ao início ou conhecer nossos cursos?
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/"
                className="rounded-md bg-ucp px-6 py-3 text-sm font-medium text-white hover:bg-[#d41c42]"
              >
                Voltar para o início →
              </Link>
              <Link
                href="/#cursos"
                className="rounded-md border border-gray-200 px-6 py-3 text-sm font-medium hover:border-gray-400"
              >
                Conhecer os cursos
              </Link>
            </div>
          </div>
          <div
            aria-hidden="true"
            className="order-1 flex items-center justify-center rounded-3xl bg-[#edfbf9] px-8 py-12 md:order-2 md:py-24"
          >
            <span className="text-[100px] font-bold leading-none tracking-tighter text-ucp sm:text-[160px] lg:text-[200px]">
              404<span className="text-[#137a73]">.</span>
            </span>
          </div>
        </section>
      </main>
      <ContentTree html={after || ''} />
      <SiteRuntime
        scripts={['/internal.js', '/dialogs.js', '/cookies.js'].map((src) => ({ src, text: '' }))}
      />
    </div>
  );
}
