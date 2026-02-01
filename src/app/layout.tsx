import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GameStoreProvider } from "@/lib/store-provider";
import { enableDebugLogs } from "../../flags";
import { FlagValues } from "flags/react";
import { precompute, evaluate } from "flags/next";
import { DebugFlagProvider } from "@/lib/debug-utils";

export const metadata: Metadata = {
  title: "Darts Scorer",
  description: "A simple darts scoring app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const flagValues = await evaluate([enableDebugLogs]);
  const precomputedFlags = await precompute([enableDebugLogs]);
  const debugEnabled = (flagValues[0]! as boolean) ?? false;
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <DebugFlagProvider value={debugEnabled}>
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
        </DebugFlagProvider>
        <FlagValues values={precomputedFlags} />
      </body>
    </html>
  );
}
