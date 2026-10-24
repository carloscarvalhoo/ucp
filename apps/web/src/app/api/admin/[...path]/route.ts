import { adminHandler } from '@/lib/admin-api';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export { adminHandler as GET, adminHandler as POST, adminHandler as PUT, adminHandler as DELETE };
