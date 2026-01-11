import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rocket Agency Dashboard',
  description: 'Manage all your GHL clients and integrations from one place',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="min-h-screen bg-[#1a1a1a]">
          {children}
        </div>
      </body>
    </html>
  )
}
