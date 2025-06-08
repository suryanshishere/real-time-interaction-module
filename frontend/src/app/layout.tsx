import "../styles/globals.css";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen justify-center items-center bg-gray-100">
        {children}
      </body>
    </html>
  );
}
