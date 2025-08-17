"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/admin-auth"

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    if (isAdminAuthenticated()) {
      router.replace("/admin/dashboard")
    } else {
      router.replace("/admin/login")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Загрузка админ-панели...</p>
      </div>
    </div>
  )
}
