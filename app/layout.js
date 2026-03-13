import './globals.css';

export const metadata = {
  title: 'Imperija - Strategijos Žaidimas',
  description: 'Next.js 16 žaidimas',
};

export default function RootLayout({ children }) {
  return (
    <html lang="lt">
      <body>{children}</body>
    </html>
  );
}
