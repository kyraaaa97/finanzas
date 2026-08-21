import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finanzas",
  description:
    "Gestiona tus finanzas personales: ingresos, gastos, presupuestos y metas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-sans">{children}</body>
    </html>
  );
}
