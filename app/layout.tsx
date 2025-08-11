import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Охотник vs Утка",
  description: "Тактический прототип",
  generator: "v0.dev",
}

const inter = Inter({ subsets: ["latin", "cyrillic"], display: "swap" })
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--font-mono" })

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={mono.variable}>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
