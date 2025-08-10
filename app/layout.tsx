import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "v0 App",
  description: "Created with v0",
  generator: "v0.dev",
}

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"], // use default regular weight; extend if needed
})

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <head>
        <style>{`
html {
  font-family: ${geist.style.fontFamily};
  --font-sans: ${geist.variable};
  --font-mono: ${geist.variable};
}
        `}</style>
      </head>
      <body className={geist.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
