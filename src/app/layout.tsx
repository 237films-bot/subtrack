import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestionnaire d'Abonnements",
  description: "Suivez vos renouvellements d'abonnements et vos dépenses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
