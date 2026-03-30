import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'sonner'

import { ThemeProvider } from '@/components/theme-provider'
import { SidebarConfigProvider } from '@/contexts/sidebar-context'
import { inter } from '@/lib/fonts'

export const metadata: Metadata = {
  title: 'Qyzen',
  description: 'Qyzen - The Next Generation of Quiz App',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="nextjs-ui-theme">
          <SidebarConfigProvider>
            {children}
            <Toaster position="bottom-right" richColors closeButton theme="system" />
          </SidebarConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
