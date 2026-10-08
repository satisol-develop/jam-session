import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SessionGate } from "@/components/auth/session-gate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Jam Session",
    template: "%s · Jam Session",
  },
  description:
    "Coordinación, repertorio y materiales de las Jam Sessions periódicas.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

/**
 * Tema inicial antes del primer pintado: el modo oscuro solo aplica dentro
 * de la plataforma (sesión iniciada, cookie jam_auth) con la preferencia
 * guardada; fuera siempre es claro. La preferencia del sistema ya no decide.
 */
const TEMA_INICIAL = `(function(){try{var t=localStorage.getItem("jam-theme");var sesion=document.cookie.indexOf("jam_auth=1")>=0;if(sesion&&t==="dark"){document.documentElement.classList.add("dark");}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Acelera la primera llamada al backend (Apps Script). React 19
            eleva estos <link> al <head>. */}
        <link rel="preconnect" href="https://script.google.com" />
        <script dangerouslySetInnerHTML={{ __html: TEMA_INICIAL }} />
        <AuthProvider>
          <SiteHeader />
          <main className="flex-1">
            <SessionGate>{children}</SessionGate>
          </main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
