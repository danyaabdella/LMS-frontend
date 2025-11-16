'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      // Not logged in - redirect to login page
      router.push('/auth/login')
    } else {
      // Logged in - redirect based on role
      if (session.user.role === 'admin') {
        router.push('/admin/analytics')
      } else if (session.user.role === 'student') {
        router.push('/student/dashboard')
      } else {
        // Unknown role - redirect to login
        router.push('/auth/login')
      }
    }
  }, [session, status, router])

  // Show loading while checking session
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-blue-400 text-xl">Loading...</div>
    </div>
  )
}
