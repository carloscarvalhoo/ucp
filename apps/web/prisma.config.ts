import { defineConfig } from 'prisma/config';
import path from 'node:path';
process.loadEnvFile(path.resolve(process.cwd(), '../../.env.local'));
const user = encodeURIComponent(process.env.MYSQL_USER || '');
const password = encodeURIComponent(process.env.MYSQL_PASSWORD || '');
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url:
      'mysql://' +
      user +
      ':' +
      password +
      '@' +
      (process.env.MYSQL_HOST || '127.0.0.1') +
      ':' +
      (process.env.MYSQL_PORT || '3307') +
      '/' +
      (process.env.MYSQL_DATABASE || 'ucp_site'),
  },
});
