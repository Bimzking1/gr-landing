import './globals.css';

export const metadata = {
  title: 'GARUNA — Run today. Own your runner type.',
  description:
    'GARUNA is a running app that knows exactly what kind of runner you are. Find out now, project your pace, and challenge your friends to beat your score.',
  openGraph: {
    title: 'GARUNA — Run today. Own your runner type.',
    description:
      'A running app that knows exactly what kind of runner you are.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
