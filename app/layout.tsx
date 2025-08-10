import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Охотник vs Утка",
  description: "Тактический прототип, Mini App Telegram поддерживается",
  generator: "v0.dev",
}

const sans = Inter({ subsets: ["latin", "cyrillic"] })
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"] })

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${sans.className} ${mono.variable || ""}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
