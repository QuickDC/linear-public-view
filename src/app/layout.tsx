import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Public Roadmap',
  description: 'View our product roadmap and share feedback',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
