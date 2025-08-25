import type { Metadata } from 'next'
import './globals.css'
// Auth removed for frontend-only app
import Providers from './components/Providers'
import Head from './head'
import FontLoader from './components/FontLoader'
import PreloadDisabler from './components/PreloadDisabler'
// import { NavigationLoader } from '../components/ui/NavigationLoader'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'
import FlutterwaveScriptLoader from '../components/FlutterwaveScriptLoader'
import ConnectionStatus from '../components/ui/ConnectionStatus'
import { NotificationContainer } from '../components/ui/Notification'
import { initializeSecurityPatches } from '@/lib/apply-security-patches'

export const metadata: Metadata = {
  title: 'ReadnWin - Your Digital Library',
  description: 'Discover, read, and manage your digital book collection with ReadnWin.',
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/site.webmanifest',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize security patches early
  await initializeSecurityPatches()
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Head />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        <PreloadDisabler />
        <FontLoader />
        <Providers>
          <ErrorBoundary>
            {/* <NavigationLoader /> */}
            <FlutterwaveScriptLoader />
            <ConnectionStatus />
            <NotificationContainer />
            {children}
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  )
}
