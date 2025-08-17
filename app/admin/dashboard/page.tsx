"use client"

import AdminGuard from "@/components/admin-guard"
import AdminDashboard from "@/components/admin-dashboard"

export default function AdminDashboardPage() {
  return (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  )
}
