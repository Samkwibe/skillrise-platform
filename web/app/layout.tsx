import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, JetBrains_Mono, Nunito } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/ui/toast";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillRise — Learn. Teach. Rise Together.",
  description:
    "SkillRise is a free platform where anyone can learn a practical skill, get certified, and get hired — and where people with knowledge teach others for free, simply to help their community rise.",
  keywords: [
    "SkillRise",
    "free skill training",
    "job ready",
    "certificate",
    "volunteer teacher",
    "youth learning",
    "career change",
    "skill platform",
  ],
  authors: [{ name: "SkillRise" }],
  creator: "SkillRise Inc.",
  metadataBase: new URL("https://skillrise.app"),
  openGraph: {
    title: "SkillRise — Learn. Teach. Rise Together.",
    description:
      "Stop scrolling. Start rising. Learn, get certified, and get hired — or teach for free to help your community.",
    url: "https://skillrise.app",
    siteName: "SkillRise",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillRise — Learn. Teach. Rise Together.",
    description:
      "Stop scrolling. Start rising. Free skill tracks, volunteer teachers, and local jobs.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#06080d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${jetbrains.variable} ${nunito.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('skillrise:theme')||'dark';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;var h=document.documentElement;h.classList.remove('dark','light');h.classList.add(r);h.style.colorScheme=r;}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "SkillRise",
              url: "https://skillrise.app",
              logo: "https://skillrise.app/favicon.svg",
              sameAs: [],
              description:
                "SkillRise is a free platform to learn, teach, and get hired — for everyone, in every neighborhood.",
            }),
          }}
        />
      </body>
    </html>
  );
}
