import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ToastProvider } from '@/components/ui/toast'
import Navigation from '@/components/Navigation'
import FooterChoreInput from '@/components/FooterChoreInput'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ThankYou Chores - 家事管理アプリ',
  description: 'パートナーと一緒に家事を管理し、感謝を伝えるアプリ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ThankYou Chores',
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
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>
            <ToastProvider>
              <div className="min-h-screen bg-gray-50">
                <Navigation />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-0">
                  {children}
                </main>
                <FooterChoreInput />
              </div>
            </ToastProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}