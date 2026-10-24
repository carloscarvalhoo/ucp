import path from 'node:path';
import { projectRoot } from '@/lib/services';
const load = process
  .getBuiltinModule('module')
  .createRequire(path.join(projectRoot, 'package.json'));
const feed = load('./instagram.cjs').createInstagramFeed();
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json(await feed(), { headers: { 'Cache-Control': 'no-store' } });
}
