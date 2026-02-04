import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GameStoreProvider } from "@/lib/store-provider";
import { evaluateFeatureFlag } from "@/lib/posthog-server";
import { PostHogProvider } from "@/lib/posthog-provider";
import { DebugFlagWrapper } from "@/components/debug-flag-wrapper";

export const metadata: Metadata = {
  title: "Darts Scorer",
  description: "A simple darts scoring app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Evaluate the debug flag on the server
  // Uses 'anonymous' as the distinct ID for unauthenticated users
  const debugEnabled = await evaluateFeatureFlag('enableDebugLogs', 'anonymous', false);
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <PostHogProvider>
          <DebugFlagWrapper debugEnabled={debugEnabled}>
            <ThemeProvider
              defaultTheme="system"
              enableSystem
              attribute="class"
              disableTransitionOnChange
            >
              <GameStoreProvider>
                <div className="flex min-h-screen flex-col divide-y">
                  <Header />
                  {children}
                  <Footer />
                </div>
              </GameStoreProvider>
            </ThemeProvider>
          </DebugFlagWrapper>
        </PostHogProvider>
      </body>
    </html>
  );
}
