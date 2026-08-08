import { QueryProvider } from '@/lib/api/query-provider'
import { type Metadata } from 'next'
// import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

// Temporary: using system fonts due to network issues
// const geistSans = Geist({
//   variable: '--font-geist-sans',
//   subsets: ['latin'],
//   display: 'swap',
//   adjustFontFallback: true,
// })
//
// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
//   display: 'swap',
//   adjustFontFallback: true,
// })

export const metadata: Metadata = {
  title: 'FoodDely | Local food delivery',
  description: 'Discover local restaurants and order delivery or pickup with FoodDely.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
