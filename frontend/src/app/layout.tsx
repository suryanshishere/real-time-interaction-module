import "../styles/globals.css";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen justify-center items-center bg-gray-100">
        <div className="absolute top-1 left-1 mx-4 my-3">
          <h1 className="text-3xl font-bold font-mono flex gap-4" >
            <span className="text-red-500">p</span>
            <span className="text-orange-500">o</span>
            <span className="text-yellow-500">l</span>
            <span className="text-green-500">l</span>
            <span className="text-blue-500">b</span>
            <span className="text-indigo-500">u</span>
            <span className="text-purple-500">z</span>
            <span className="text-pink-500">z</span>
          </h1>
        </div>
        {children}
      </body>
    </html>
  );
}
