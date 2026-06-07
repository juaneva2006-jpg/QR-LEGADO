import type { Metadata } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import Script from 'next/script'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Legado Gastrobar — Cocina de Herencia',
  description:
    'Legado Gastrobar, un lugar donde el tiempo se detiene y cada momento se vuelve recuerdo. Pide desde tu mesa escaneando el código QR.',
  keywords: ['gastrobar', 'legado', 'restaurante', 'pedidos qr', 'valencia'],
  authors: [{ name: 'Legado Gastrobar' }],
  openGraph: {
    title: 'Legado Gastrobar',
    description: 'Cocina de herencia. Pide desde tu mesa.',
    type: 'website',
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
  themeColor: '#100C06',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Legado KDS',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-inter bg-legado-dark text-legado-cream antialiased">
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#2A1F10',
              color: '#F5EFE0',
              border: '1px solid #E8763A',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: {
                primary: '#E8763A',
                secondary: '#F5EFE0',
              },
            },
          }}
        />
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('SW registration successful with scope: ', registration.scope);
                  },
                  function(err) {
                    console.log('SW registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
