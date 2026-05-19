import type { Metadata, Viewport } from "next"
import { Poppins, Geist_Mono, Cormorant_Garamond } from "next/font/google"
import ClientLayout from "./ClientLayout"
import "./globals.css"

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: "Pokémon Johto LifeSync",
  description:
    "Real-life habits power your Pokémon Johto journey. Complete tasks, earn PKD, and progress through an embedded GBA emulator.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Oracle",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#06b6d4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${poppins.variable} ${geistMono.variable} ${cormorantGaramond.variable} h-full antialiased`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col">
        <ClientLayout>{children}</ClientLayout>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
