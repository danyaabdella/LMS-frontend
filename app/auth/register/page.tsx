'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, MapPin } from 'lucide-react'
import { userApi } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
    geographicalLocation: '',
  })

  // Get user's geographical location on component mount
  useEffect(() => {
    getGeographicalLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getGeographicalLocation = async () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser.')
      return
    }

    setLocationLoading(true)
    
    try {
      // Get coordinates
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: false,
        })
      })

      const { latitude, longitude } = position.coords

      // Reverse geocode to get location name (using a free API)
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        )
        const locationData = await response.json()
        
        // Format location as "City, Country" or "Country"
        const location = locationData.locality 
          ? `${locationData.locality}, ${locationData.countryName}`
          : locationData.countryName || `${latitude}, ${longitude}`
        
        setFormData(prev => ({ ...prev, geographicalLocation: location }))
      } catch (error) {
        // Fallback to coordinates if reverse geocoding fails
        setFormData(prev => ({ 
          ...prev, 
          geographicalLocation: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` 
        }))
      }
    } catch (error) {
      console.log('Error getting location:', error)
      // User denied location or error occurred - location will be optional
    } finally {
      setLocationLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setLoading(true)

    try {
      const result = await userApi.register({
        email: formData.email,
        username: formData.username,
        name: formData.name,
        password: formData.password,
        geographicalLocation: formData.geographicalLocation || undefined,
      })

      if (result.success) {
        toast.success('Registration successful! Please login.')
        router.push('/auth/login')
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-blue-400">Register</CardTitle>
          <CardDescription className="text-slate-400">
            Create a new student account
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
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={loading}
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                minLength={6}
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={loading}
                minLength={6}
                className="bg-slate-700/50 border-slate-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="geographicalLocation" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </Label>
              <div className="flex gap-2">
                <Input
                  id="geographicalLocation"
                  type="text"
                  placeholder="Detecting your location..."
                  value={formData.geographicalLocation}
                  onChange={(e) => setFormData({ ...formData, geographicalLocation: e.target.value })}
                  disabled={loading || locationLoading}
                  className="bg-slate-700/50 border-slate-600 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getGeographicalLocation}
                  disabled={loading || locationLoading}
                  className="px-3"
                >
                  {locationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Your location helps us provide better analytics. You can edit or leave it blank.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Register'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-400 hover:underline">
              Login here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


