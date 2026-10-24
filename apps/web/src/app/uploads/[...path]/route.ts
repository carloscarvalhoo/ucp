import fs from 'node:fs/promises';
import path from 'node:path';
import { projectRoot } from '@/lib/services';
export const dynamic = 'force-dynamic';
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  const root = path.join(projectRoot, 'storage/uploads');
  const file = path.resolve(root, ...parts);
  if (!file.startsWith(root + path.sep)) return new Response(null, { status: 404 });
  try {
    let data: Buffer;
    try {
      data = await fs.readFile(file);
    } catch {
      const legacy = path.resolve(projectRoot, 'dist/uploads', ...parts);
      const legacyRoot = path.join(projectRoot, 'dist/uploads');
      if (!legacy.startsWith(legacyRoot + path.sep)) return new Response(null, { status: 404 });
      data = await fs.readFile(legacy);
    }
    const types: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
    };
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
