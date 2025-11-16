'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      if (session.user.role === 'admin') {
        router.push('/admin/analytics')
      } else if (session.user.role === 'student') {
        router.push('/student/dashboard')
      }
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid email or password')
      } else if (result?.ok) {
        toast.success('Login successful!')
        
        // Update session to get latest user data
        await update()
        
        // Small delay to ensure session is updated
        setTimeout(() => {
          // The useEffect will handle the redirect based on role
          router.refresh()
        }, 100)
      }
    } catch (error) {
      toast.error('An error occurred during login')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-400">Login</CardTitle>
          <CardDescription className="text-slate-400">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-blue-400 hover:underline">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


