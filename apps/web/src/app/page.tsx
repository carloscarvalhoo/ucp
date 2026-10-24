import { homeDescription } from '@/lib/seo';
import { PublicPage } from '@/components/public-page';
import { getPublicPage } from '@/lib/public-content';
export const revalidate = 60;
export async function generateMetadata() {
  const page = await getPublicPage('/');
  return { title: page.title, description: homeDescription, alternates: { canonical: '/' } };
}
export default function Home() {
  return <PublicPage pathname="/" />;
}
