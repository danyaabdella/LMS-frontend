'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Shield, AlertTriangle } from 'lucide-react'
import { useSession } from 'next-auth/react'

// Get or create user ID
function getUserId(): string {
  if (typeof window === 'undefined') return 'USER-0000'
  
  let userId = localStorage.getItem('userId')
  if (!userId) {
    // Generate a user ID if not exists
    userId = `USER-${Date.now().toString().slice(-6)}`
    localStorage.setItem('userId', userId)
  }
  return userId
}

export default function VideoProtectionPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [protectionActive, setProtectionActive] = useState(true)
  const [copyAttempts, setCopyAttempts] = useState(0)
  const [recordingDetected, setRecordingDetected] = useState(false)
  const { data: session, status } = useSession()
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Initialize user ID
  // Fetch actual user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      if (status === 'loading') return;
      
      if (session?.user) {
        try {
          // Use your actual API endpoint
          const response = await fetch('/api/users/me', {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
            },
          });
          
          if (response.ok) {
            const user = await response.json();
            setUserData(user);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session, status]);

  // Get the actual user ID or fallback
  const getUserId = () => {
    if (userData?.id) return `USER-${userData.id}`;
    if (session?.user?.id) return `USER-${session.user.id}`;
    if (session?.user?.email) return `USER-${session.user.email.split('@')[0]}`;
    return 'USER-GUEST';
  };

  const getUsername = () => {
    if (userData?.username) return userData.username;
    if (session?.user?.name) return session.user.name;
    if (session?.user?.email) return session.user.email.split('@')[0];
    return 'Guest User';
  };

  useEffect(() => {
    if (!protectionActive) return;
  
    // Prevent right-click
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };
  
    // Block copy
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setCopyAttempts(prev => prev + 1);
    };
  
    // Block devtools key shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "C") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        e.key === "F12"
      ) {
        e.preventDefault();
      }
    };
  
    // Detect devtools by measuring window size drop
    const detectDevTools = () => {
      if (window.outerHeight - window.innerHeight > 160) {
        setRecordingDetected(true);
      }
    };
  
    // Detect window losing focus
    const handleBlur = () => {
      if (videoRef.current) {
        videoRef.current.style.filter = "blur(20px)";
        videoRef.current.pause();
      }
    };
  
    // Detect tab focus
    const handleFocus = () => {
      if (videoRef.current) {
        videoRef.current.style.filter = "none";
        videoRef.current.play().catch(() => {});
      }
    };
  
    // Visibility change
    const handleVisibility = () => {
      if (document.hidden) {
        handleBlur();
      } else {
        handleFocus();
      }
    };
  
    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("copy", handleCopy);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
  
    const interval = setInterval(detectDevTools, 1000);
  
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("copy", handleCopy);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, [protectionActive]);
  
  // Watermark overlay with user ID
  useEffect(() => {
    if (!protectionActive || !videoRef.current) return

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 800
    canvas.height = 600
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.font = 'bold 24px Arial'
    ctx.fillText('© Protected Content - Unauthorized Recording Prohibited', 50, 50)

    // Add user ID watermark
    ctx.font = 'bold 20px Arial'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fillText(`User ID: ${getUserId()}`, 50, 100)
  }, [protectionActive, getUserId()])

  // Initialize DRM video using Shaka Player
  useEffect(() => {
    if (!protectionActive) {
      // Cleanup if protection is disabled
      if (playerRef.current) {
        import('@/lib/drm').then(({ destroyDRMPlayer }) => {
          destroyDRMPlayer(playerRef.current)
          playerRef.current = null
        })
      }
      return
    }

    const initDRM = async () => {
      try {
        const { initDRMPlayer } = await import('@/lib/drm')
        
        const player = await initDRMPlayer({
          videoElementId: 'drmVideo',
          manifestUrl: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-widevine/dash.mpd',
          licenseServer: 'https://cwip-shaka-proxy.appspot.com/no_auth',
          onError: (error) => {
            console.error('DRM initialization error:', error)
          },
          onLoad: () => {
            console.log('DRM video loaded successfully')
          },
        })
        playerRef.current = player
      } catch (error) {
        console.error('Failed to initialize DRM:', error)
      }
    }

    initDRM()

    return () => {
      if (playerRef.current) {
        import('@/lib/drm').then(({ destroyDRMPlayer }) => {
          destroyDRMPlayer(playerRef.current)
          playerRef.current = null
        })
      }
    }
  }, [protectionActive])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-blue-400">Screen Recording Protection Demo</h1>
              <p className="text-slate-400">Browser-based content protection mechanisms</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Protection Toggle */}
        <Card className="border-slate-700 bg-slate-800/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Protection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold mb-2">
                  {protectionActive ? '✓ Protection Active' : '✗ Protection Disabled'}
                </p>
                <p className="text-slate-400 text-sm">
                  Toggle protection mechanisms on/off to test functionality
                </p>
              </div>
              <Button
                onClick={() => setProtectionActive(!protectionActive)}
                variant={protectionActive ? 'default' : 'outline'}
              >
                {protectionActive ? 'Disable' : 'Enable'} Protection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {recordingDetected && (
          <Alert className="mb-8 border-red-500/50 bg-red-500/10">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              Screen recording or sharing attempt detected! This is logged and monitored.
            </AlertDescription>
          </Alert>
        )}

        {copyAttempts > 0 && (
          <Alert className="mb-8 border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-300">
              {copyAttempts} copy attempt(s) detected. Content copy is disabled.
            </AlertDescription>
          </Alert>
        )}

        {/* Video Player with Protection */}
        <Card className="border-slate-700 bg-slate-800/50 mb-8">
          <CardHeader>
            <CardTitle>Protected Video Content</CardTitle>
            <CardDescription>
              This video has multiple protection layers enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              ref={containerRef}
              className="relative rounded-lg overflow-hidden bg-black select-none"
              onContextMenu={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              <video
                id="drmVideo"
                ref={videoRef}
                width="100%"
                height="400"
                controls
                style={{ backgroundColor: 'black' }}
                playsInline
              />


              {/* Watermark Overlay */}
              {protectionActive && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <div className="text-4xl font-bold text-white rotate-45 whitespace-nowrap">
                      © Protected - Do Not Record
                    </div>
                  </div>
                  {/* User ID Overlay */}
                  <div className="absolute top-4 left-4 z-10 pointer-events-none">
                    <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                      <p className="text-white font-bold text-lg">User ID: {getUserId()}</p>
                      <p className="text-white/70 text-xs mt-1">
                        {new Date().toLocaleString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Protection Explanation */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle>Implemented Protections</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <div>
                    <p className="font-semibold">Right-Click Blocking</p>
                    <p className="text-sm text-slate-400">Context menu disabled</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <div>
                    <p className="font-semibold">Copy Prevention</p>
                    <p className="text-sm text-slate-400">Clipboard disabled with alerts</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <div>
                    <p className="font-semibold">Developer Tools Blocking</p>
                    <p className="text-sm text-slate-400">F12 and shortcuts disabled</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <div>
                    <p className="font-semibold">Drag Prevention</p>
                    <p className="text-sm text-slate-400">Drag and drop disabled</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-green-400">✓</span>
                  <div>
                    <p className="font-semibold">Watermarking</p>
                    <p className="text-sm text-slate-400">Visual watermark overlay</p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle>Limitations & Disclaimers</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="text-yellow-400 shrink-0">⚠</span>
                  <p>Screen recording cannot be 100% prevented at browser level</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-yellow-400 shrink-0">⚠</span>
                  <p>Advanced tools (OBS, ffmpeg) can bypass browser protections</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-yellow-400 shrink-0">⚠</span>
                  <p>DRM solutions provide stronger protection but need server-side setup</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-yellow-400 shrink-0">⚠</span>
                  <p>Watermarking serves as deterrent and evidence, not prevention</p>
                </li>
                <li className="flex gap-3">
                  <span className="text-yellow-400 shrink-0">⚠</span>
                  <p>User monitoring requires server logging and analytics</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="border-slate-700 bg-slate-800/50 mt-8">
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900/50 rounded p-4 font-mono text-sm text-slate-300 overflow-x-auto">
              <pre>{`// Browser protections + DRM (Widevine):

1. DRM Encryption (Widevine):
   - Decryption handled only inside CDM (Content Decryption Module)
   - Screen recording captures black frames
   - Encrypted .mpd MPEG-DASH stream
   - License server required for playback

2. Browser Protections:
   - Right-click disabled
   - Copy prevented
   - Devtools shortcuts blocked
   - Visibility change blurs video
   - User watermark overlay

3. Watermark + Monitoring:
   - User ID watermark
   - Timestamp
   - Copy attempts logged
   - Devtools detection

Note: DRM is the **only reliable way** to stop screen recording.`}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
