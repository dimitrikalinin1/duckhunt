import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Админ-панель | Duck Hunter",
  description: "Панель администратора для управления игрой Duck Hunter",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold text-gray-900">Duck Hunter - Админ-панель</h1>
            <div className="text-sm text-gray-500">Только для веб-версии</div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
