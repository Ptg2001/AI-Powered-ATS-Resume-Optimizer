"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "./auth-provider"
import { Loader2 } from "lucide-react"

export function AuthForm() {
  const { login, signup, loading } = useAuth()
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [signupData, setSignupData] = useState({ email: "", password: "", name: "" })
  const [errors, setErrors] = useState<{ login?: string; signup?: string }>({})

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const loginDisabled = useMemo(() => {
    return !isValidEmail(loginData.email) || loginData.password.length < 6 || loading
  }, [loginData, loading])

  const signupDisabled = useMemo(() => {
    return (
      signupData.name.trim().length < 2 ||
      !isValidEmail(signupData.email) ||
      signupData.password.length < 6 ||
      loading
    )
  }, [signupData, loading])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      if (loginDisabled) return
      await login(loginData.email, loginData.password)
    } catch (error) {
      setErrors((prev) => ({ ...prev, login: "Invalid email or password" }))
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    try {
      if (signupDisabled) return
      await signup(signupData.email, signupData.password, signupData.name)
    } catch (error) {
      setErrors((prev) => ({ ...prev, signup: "Signup failed. Email may already be registered." }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="absolute inset-0 -z-10 pointer-events-none" aria-hidden></div>
      <Card className="w-full max-w-md shadow-xl ring-1 ring-primary/10 backdrop-blur bg-card/80">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-serif font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            AI-Powered ATS
          </CardTitle>
          <CardDescription className="text-base">Optimize your resume for better job opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    aria-invalid={!isValidEmail(loginData.email)}
                  />
                  {!isValidEmail(loginData.email) && loginData.email && (
                    <p className="text-xs text-destructive">Please enter a valid email.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password (min 6 chars)"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    aria-invalid={loginData.password.length > 0 && loginData.password.length < 6}
                  />
                  {loginData.password.length > 0 && loginData.password.length < 6 && (
                    <p className="text-xs text-destructive">Password must be at least 6 characters.</p>
                  )}
                </div>
                {errors.login ? <p className="text-sm text-destructive">{errors.login}</p> : null}
                <Button type="submit" className="w-full" disabled={loginDisabled} aria-disabled={loginDisabled}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Login
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signupData.name}
                    onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                    required
                    aria-invalid={signupData.name !== "" && signupData.name.trim().length < 2}
                  />
                  {signupData.name !== "" && signupData.name.trim().length < 2 && (
                    <p className="text-xs text-destructive">Please enter your full name.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                    aria-invalid={!isValidEmail(signupData.email)}
                  />
                  {!isValidEmail(signupData.email) && signupData.email && (
                    <p className="text-xs text-destructive">Please enter a valid email.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password (min 6 chars)"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                    aria-invalid={signupData.password !== "" && signupData.password.length < 6}
                  />
                  {signupData.password !== "" && signupData.password.length < 6 && (
                    <p className="text-xs text-destructive">Password must be at least 6 characters.</p>
                  )}
                </div>
                {errors.signup ? <p className="text-sm text-destructive">{errors.signup}</p> : null}
                <Button type="submit" className="w-full" disabled={signupDisabled} aria-disabled={signupDisabled}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
