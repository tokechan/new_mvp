import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ToastProvider } from '@/components/ui/toast'
import Navigation from '@/components/Navigation'
import ThemeProvider from '@/components/ThemeProvider'
import PwaInitializer from '@/components/PwaInitializer'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

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
    icon: '/icon-192x192.svg',
    apple: '/icon-192x192.svg',
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
      <body className={inter.className}>
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
