import type { Metadata } from 'next'
import { Providers } from '@/lib/providers'
import { TenantProvider } from '@/lib/tenant-context'
import './globals.css'

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
      <body className="font-sans antialiased">
        <Providers>
          <TenantProvider>
            {children}
          </TenantProvider>
        </Providers>
      </body>
    </html>
  )
}
