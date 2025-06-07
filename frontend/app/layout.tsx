import '../styles/globals.css';
import { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="p-4 bg-gray-100">{children}</body>
    </html>
  );
}