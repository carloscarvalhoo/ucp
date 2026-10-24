import type { MetadataRoute } from 'next';
import { siteURL } from '@/lib/seo';
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/admin/', '/api/'] }],
    sitemap: siteURL + '/sitemap.xml',
  };
}
