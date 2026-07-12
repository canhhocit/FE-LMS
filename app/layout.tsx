import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import { LmsProvider } from '@/lib/lms-store'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Meridian LMS — University Learning Portal',
  description:
    'A modern university learning management system for students, lecturers, and the training department.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#2f5fd1',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable} bg-background`}>
      <body className="font-sans antialiased">
        <LmsProvider>{children}</LmsProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
