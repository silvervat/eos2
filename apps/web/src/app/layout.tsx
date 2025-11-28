import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/lib/providers'
import { TenantProvider } from '@/lib/tenant-context'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rivest Platform',
  description: 'Construction Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="et">
      <body className={inter.className}>
        <Providers>
          <TenantProvider>
            {children}
          </TenantProvider>
        </Providers>
      </body>
    </html>
  )
}
