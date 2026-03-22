import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RealEstate App',
  description: 'Find your dream home',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                RealEstate
              </Link>
              <div className="flex gap-6 text-sm font-medium text-gray-600">
                <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
                <Link href="/cities" className="hover:text-blue-600 transition-colors">Cities</Link>
                <Link href="/agents" className="hover:text-blue-600 transition-colors">Agents</Link>
              </div>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="bg-gray-900 text-gray-400 text-sm py-10 mt-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p>&copy; 2026 RealEstate App. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}
