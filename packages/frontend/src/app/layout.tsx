import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GameStoreProvider } from "@/lib/store-provider";
import { getFeatureFlags } from "@/lib/get-feature-flags";

export const metadata: Metadata = {
  title: "Darts Scorer",
  description: "A simple darts scoring app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const featureFlags = await getFeatureFlags();

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          defaultTheme="system"
          enableSystem
          attribute="class"
          disableTransitionOnChange
        >
          <GameStoreProvider>
            <div className="flex min-h-screen flex-col divide-y">
              <Header />
              <div id="posthog-feature-flags" hidden>
                {JSON.stringify(featureFlags)}
              </div>
              {children}
              <Footer />
            </div>
          </GameStoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
