import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Activity Dashboard — Account Monitor',
  description:
    'Upload your Excel activity report and explore account-level details including reasons, CR/RITM, concern teams, and quarters in a beautiful interactive dashboard.',
  keywords: ['activity dashboard', 'account monitor', 'excel upload', 'CR RITM tracker'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ActivityDash',
  },
  icons: {
    icon: '/icon-512.png',
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#6C63FF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
