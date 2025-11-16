'use client'

import { useEffect, useRef } from 'react'
import { initDRMPlayer, destroyDRMPlayer } from '@/lib/drm'

export default function DRMPlayerPage() {
  const playerRef = useRef<any>(null)

  useEffect(() => {
    let player: any = null

    const initPlayer = async () => {
      try {
        player = await initDRMPlayer({
          videoElementId: 'drmVideo',
          manifestUrl: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-widevine/dash.mpd',
          licenseServer: 'https://cwip-shaka-proxy.appspot.com/no_auth',
          onError: (error) => {
            console.error('DRM Load Error:', error)
          },
          onLoad: () => {
            console.log('DRM Video Loaded')
          },
        })
        playerRef.current = player
      } catch (err) {
        console.error('DRM initialization failed:', err)
      }
    }

    initPlayer()

    return () => {
      if (playerRef.current) {
        destroyDRMPlayer(playerRef.current)
      }
    }
  }, [])

  return (
    <div className="w-full h-screen bg-black flex flex-col items-center p-8">
      <h1 className="text-white text-3xl font-bold mb-6">
        DRM Protected Video (Widevine)
      </h1>

      <video
        id="drmVideo"
        width="800"
        controls
        autoPlay
        playsInline
        style={{ backgroundColor: 'black' }}
      />

      <p className="text-gray-400 mt-4 text-sm">
        Screen recording will show a black screen due to Widevine DRM protection.
      </p>
    </div>
  )
}
