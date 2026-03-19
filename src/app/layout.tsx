import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = {
  title: "Delmar Margin Dashboard",
  description: "Property-level utility margin tracking for Delmar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="container mx-auto py-6 px-4 max-w-7xl">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
