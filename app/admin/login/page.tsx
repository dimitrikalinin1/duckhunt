"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLogin() {
  const [credentials, setCredentials] = useState({ login: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (credentials.login === "smol239" && credentials.password === "password") {
      // Set admin session
      localStorage.setItem("admin_session", "authenticated")
      sessionStorage.setItem("admin_auth", "true")
      router.push("/admin/dashboard")
    } else {
      setError("Неверный логин или пароль")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md minimal-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Админ-панель</CardTitle>
          <CardDescription>Войдите для доступа к панели управления</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Логин</Label>
              <Input
                id="login"
                type="text"
                value={credentials.login}
                onChange={(e) => setCredentials((prev) => ({ ...prev, login: e.target.value }))}
                className="minimal-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
                className="minimal-input"
                required
              />
            </div>
            {error && <div className="text-destructive text-sm text-center">{error}</div>}
            <Button type="submit" className="w-full minimal-button" disabled={loading}>
              {loading ? "Вход..." : "Войти"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
