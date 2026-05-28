import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bonificação SEPENG',
  description: 'Sistema de avaliação e bonificação',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50">
        <header className="bg-blue-700 text-white px-6 py-4 shadow-sm">
          <a href="/" className="text-base font-bold tracking-wide hover:opacity-90">
            SEPENG · Sistema de Bonificação
          </a>
        </header>
        <main className="py-8">{children}</main>
      </body>
    </html>
  )
}
