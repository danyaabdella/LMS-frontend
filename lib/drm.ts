/**
 * DRM Utility for Shaka Player
 * Handles loading Shaka Player script and initializing DRM-protected video
 */

export interface DRMConfig {
  videoElementId: string
  manifestUrl: string
  licenseServer?: string
  onError?: (error: Error) => void
  onLoad?: () => void
}

let shakaLoaded = false
let shakaLoading = false
const shakaLoadPromise: Promise<void> | null = null

/**
 * Load Shaka Player script dynamically
 */
export function loadShakaPlayer(): Promise<void> {
  if (shakaLoaded) {
    return Promise.resolve()
  }

  if (shakaLoading && shakaLoadPromise) {
    return shakaLoadPromise
  }

  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof window !== 'undefined' && (window as any).shaka) {
      shakaLoaded = true
      resolve()
      return
    }

    shakaLoading = true

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="shaka-player"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        shakaLoaded = true
        shakaLoading = false
        resolve()
      })
      existingScript.addEventListener('error', () => {
        shakaLoading = false
        reject(new Error('Failed to load Shaka Player'))
      })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.3.5/shaka-player.compiled.js'
    script.async = true

    script.onload = () => {
      shakaLoaded = true
      shakaLoading = false
      resolve()
    }

    script.onerror = () => {
      shakaLoading = false
      reject(new Error('Failed to load Shaka Player script'))
    }

    document.body.appendChild(script)
  })
}

/**
 * Initialize DRM player with Shaka Player
 */
export async function initDRMPlayer(config: DRMConfig): Promise<any> {
  try {
    // Load Shaka Player if not already loaded
    await loadShakaPlayer()

    if (!(window as any).shaka) {
      throw new Error('Shaka Player not available')
    }

    const video = document.getElementById(config.videoElementId) as HTMLVideoElement
    if (!video) {
      throw new Error(`Video element with id "${config.videoElementId}" not found`)
    }

    const player = new (window as any).shaka.Player(video)

    // Configure DRM
    player.configure({
      drm: {
        servers: {
          'com.widevine.alpha': config.licenseServer || 'https://cwip-shaka-proxy.appspot.com/no_auth',
        },
      },
    })

    // Add error handler
    player.addEventListener('error', (event: any) => {
      const error = new Error(`Shaka Player error: ${event.detail?.message || 'Unknown error'}`)
      console.error('DRM Error:', error)
      if (config.onError) {
        config.onError(error)
      }
    })

    // Load manifest
    await player.load(config.manifestUrl)

    if (config.onLoad) {
      config.onLoad()
    }

    console.log('DRM Video loaded successfully')
    return player
  } catch (error) {
    console.error('DRM initialization error:', error)
    if (config.onError) {
      config.onError(error instanceof Error ? error : new Error(String(error)))
    }
    throw error
  }
}

/**
 * Cleanup DRM player
 */
export function destroyDRMPlayer(player: any): void {
  if (player && typeof player.destroy === 'function') {
    try {
      player.destroy()
    } catch (error) {
      console.error('Error destroying DRM player:', error)
    }
  }
}














