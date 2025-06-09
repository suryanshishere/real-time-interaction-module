import "../styles/globals.css";
import { getServerToken } from "lib/getServerToken";
import ClientProviders from "@shared/wrapper/ClientProviders";
import AuthChecker from "@components/auth/AuthChecker";
import Response from "@shared/utils/Response";
import AuthModal from "@components/auth/AuthModal";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tokenExpiration, tokenExists } = await getServerToken();
  return (
    <html lang="en">
      <body className="relative flex flex-col justify-center items-center min-h-screen gap-10 bg-gray-100 p-4">
        <ClientProviders>
          <Response />
          {/* TODO deactivation or token expiry checker */}
          <AuthChecker tokenExpiration={tokenExpiration} /> 
            {children} 
          <AuthModal tokenExists={tokenExists} />
        </ClientProviders>
      </body>
    </html>
  );
}
