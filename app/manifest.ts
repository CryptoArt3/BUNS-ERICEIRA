import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BUNS Ericeira',
    short_name: 'BUNS',
    description: 'Smash Burgers · Surf · Ericeira',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    orientation: 'portrait',
    icons: [
      {
        src: '/favicon/logo180.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/favicon/logo512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
