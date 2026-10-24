import { permanentRedirect } from 'next/navigation';
import { PublicPage } from '@/components/public-page';
import { getPublicPage } from '@/lib/public-content';
export const revalidate = 60;
type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (slug.at(-1)?.endsWith('.html')) return {};
  const page = await getPublicPage('/' + slug.join('/'));
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: '/' + slug.join('/') },
  };
}
export default async function Page({ params, searchParams }: Props) {
  const { slug } = await params;
  const pathname = '/' + slug.join('/');
  if (pathname.endsWith('.html') || pathname === '/index') {
    const values = await searchParams;
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(values))
      for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value])
        query.append(key, item);
    const target =
      pathname === '/index.html' || pathname === '/index' ? '/' : pathname.slice(0, -5);
    permanentRedirect(target + (query.size ? '?' + query.toString() : ''));
  }
  return <PublicPage pathname={pathname} />;
}
