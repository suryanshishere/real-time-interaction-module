import "../styles/globals.css";
import { getServerToken } from "lib/getServerToken";
import ClientProviders from "@shared/wrapper/ClientProviders";
import AuthChecker from "@components/auth/AuthChecker";
import Response from "@shared/utils/Response";
import AuthModal from "@components/auth/AuthModal";

export const metadata = {
  title: "pollbuzz",
  description:
    "PollBuzz lets you create, join, and interact with live polls in real-time. Perfect for teams, events, classrooms, and social interactions.",
  icons: {
    icon: "/icon.png",
  },
};

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
          {/* Test credentials for development/testing purposes */}
          <p className="text-xs text-gray-500">
            For testing: <br />
            <span className="font-mono">
              email: heresuryanshsingh@gmail.com
            </span>
            <br />
            <span className="font-mono">password: test12345</span>
          </p>
        </ClientProviders>
      </body>
    </html>
  );
}
