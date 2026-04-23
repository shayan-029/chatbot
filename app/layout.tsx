import type { Metadata, Viewport } from "next";
import "./globals.css";

// =============================================
// Root Layout
// =============================================

export const metadata: Metadata = {
  title: "Grok Chat",
  description: "AI chatbot powered by Grok (xAI)",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✦</text></svg>" },
};

export const viewport: Viewport = {
  themeColor: "#0d0d0f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
