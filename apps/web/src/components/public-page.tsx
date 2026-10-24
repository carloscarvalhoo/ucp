import { ContentTree } from './content-tree';
import { getPublicPage } from '@/lib/public-content';
import { SiteRuntime } from './site-runtime';
export async function PublicPage({ pathname }: { pathname: string }) {
  const page = await getPublicPage(pathname);
  return (
    <>
      <div className="public-site">
        {page.styles.map((href) => (
          <link key={href} rel="stylesheet" href={href} />
        ))}
        <ContentTree html={page.html} />
      </div>
      <SiteRuntime scripts={page.scripts} />
    </>
  );
}
