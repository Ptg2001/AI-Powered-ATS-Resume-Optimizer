"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getUsers(): Array<User & { password: string }> {
  try {
    const raw = localStorage.getItem("ats-users")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUsers(users: Array<User & { password: string }>) {
  localStorage.setItem("ats-users", JSON.stringify(users))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem("ats-current-user")
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {}
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const users = getUsers()
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase())
      if (!found || found.password !== password) {
        throw new Error("Invalid email or password")
      }
      const current: User = { id: found.id, email: found.email, name: found.name }
      setUser(current)
      localStorage.setItem("ats-current-user", JSON.stringify(current))
    } finally {
      setLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string) => {
    setLoading(true)
    try {
      const users = getUsers()
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Email already registered")
      }
      const newUser = { id: Date.now().toString(36), email, name, password }
      const updated = [...users, newUser]
      saveUsers(updated)
      const current: User = { id: newUser.id, email, name }
      setUser(current)
      localStorage.setItem("ats-current-user", JSON.stringify(current))
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("ats-current-user")
  }

  return <AuthContext.Provider value={{ user, login, signup, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
