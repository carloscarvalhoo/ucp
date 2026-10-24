import { ConfirmationProvider } from '@/components/admin/confirmation';
import { AdminApp } from '@/components/admin/admin-app';
export const metadata = { title: 'Administração | UCP', robots: { index: false, follow: false } };
export default function Admin() {
  return (
    <ConfirmationProvider>
      <AdminApp />
    </ConfirmationProvider>
  );
}
