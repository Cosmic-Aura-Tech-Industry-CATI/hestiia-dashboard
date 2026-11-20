import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'Hestiia Restaurant — Admin Dashboard',
  description: 'DIMISI Technologies - Hestiia Restaurant Management Admin Dashboard',
  icons: {
    icon: '/brand-icon.jpg?v=3',
    shortcut: '/favicon.ico?v=3',
    apple: '/brand-icon.jpg?v=3',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-charcoal-950 text-warmwhite antialiased selection:bg-gold selection:text-charcoal-950 font-sans">
        {children}
      </body>
    </html>
  );
}
