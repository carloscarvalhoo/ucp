import fs from 'node:fs/promises';
import path from 'node:path';
import { content, projectRoot, publicURL } from '@/lib/services';
export const dynamic = 'force-dynamic';
export async function GET() {
  let script = await content.runtime(
    await fs.readFile(path.join(projectRoot, 'dist/site-data.js'), 'utf8'),
  );
  script +=
    '\nwindow.ucpCourses=window.ucpCourses.map(c=>({...c,url:(' +
    publicURL.toString() +
    ')(c.url)}));';
  return new Response(script, {
    headers: { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
