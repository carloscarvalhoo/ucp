import 'server-only';
import path from 'node:path';
export const projectRoot = path.resolve(process.cwd(), '../..');
try {
  process.loadEnvFile(path.join(projectRoot, '.env.local'));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}
