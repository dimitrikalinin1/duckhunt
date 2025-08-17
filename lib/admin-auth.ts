"use client"

export const isAdminAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false

  const sessionAuth = sessionStorage.getItem("admin_auth")
  const localAuth = localStorage.getItem("admin_session")

  return sessionAuth === "true" && localAuth === "authenticated"
}

export const logoutAdmin = (): void => {
  if (typeof window === "undefined") return

  sessionStorage.removeItem("admin_auth")
  localStorage.removeItem("admin_session")
}

export const requireAdminAuth = (callback: () => void): void => {
  if (!isAdminAuthenticated()) {
    window.location.href = "/admin/login"
    return
  }
  callback()
}
