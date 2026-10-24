import { siteURL, homeDescription } from '@/lib/seo';
import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'UCP — Faculdade do Centro do Paraná',
  description: homeDescription,
  icons: { icon: 'data:,' },
  metadataBase: new URL(siteURL),
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
