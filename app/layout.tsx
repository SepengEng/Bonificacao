import type { Metadata } from 'next'
import Image from 'next/image'
import './globals.css'

export const metadata: Metadata = {
  title: 'SEPENG · Bonificação',
  description: 'Sistema de avaliação e bonificação de desempenho',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <header style={{ background: 'var(--navy)', borderBottom: '1px solid var(--navy-light)' }}>
          <div className="max-w-5xl mx-auto px-6 py-0 flex items-center justify-between" style={{ height: 56 }}>
            <a href="/" className="flex items-center gap-3 hover:opacity-85 transition-opacity">
              <Image src="/sepeng-logo.png" alt="SEPENG" width={110} height={29} priority style={{ objectFit: 'contain' }} />
              <span style={{
                borderLeft: '1px solid rgba(255,255,255,0.2)',
                paddingLeft: 12,
                fontSize: 13,
                color: 'rgba(255,255,255,0.6)',
                letterSpacing: '0.02em',
                fontWeight: 400,
              }}>
                Sistema de Bonificação
              </span>
            </a>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
