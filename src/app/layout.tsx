import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ToastProvider } from '@/shared/ui/toast'
import Navigation from '@/features/layout/components/Navigation'
import ThemeProvider from '@/shared/components/ThemeProvider'
import PwaInitializer from '@/shared/components/PwaInitializer'
import Footer from '@/features/layout/components/Footer'

export const metadata: Metadata = {
  title: 'YOUDO - 家事共有アプリ',
  description: 'パートナーと一緒に家事を管理し、感謝を伝えるアプリ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'YOUDO',
  },
  icons: {
    icon: [
      { url: '/icon-192x192.svg', type: 'image/svg+xml', sizes: '192x192' },
      { url: '/icon-512x512.svg', type: 'image/svg+xml', sizes: '512x512' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon-152x152.png', sizes: '152x152' },
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180' },
      { url: '/icons/apple-touch-icon-192x192.png', sizes: '192x192' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: 'hsl(222.2 84% 4.9%)' },
    { media: '(prefers-color-scheme: light)', color: 'hsl(210 40% 96.1%)' },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <ToastProvider>
                <div className="flex min-h-screen flex-col bg-background">
                  <PwaInitializer />
                  <Navigation />
                  <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-12 pt-8 sm:px-6 lg:px-8">
                    {children}
                  </main>
                  <Footer />
                </div>
              </ToastProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
