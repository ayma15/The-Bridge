import { useMemo, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useTheme } from '../../contexts/ThemeContext'
import { ArrowLeft, CheckCircle2, Palette } from 'lucide-react'

const PRESETS: string[] = [
  'The Bridge',
  'Synthwave',
  'Vaporwave',
  'Neon Noir',
  'Glitchcore',
  'Retrofuturism',
  'Solarpunk',
  'Brutalism',
  'Matrix Aesthetic',
  'Monospace Terminal',
  'Hyperpop',
  'Corporate Swiss',
  'Gothic Baroque',
  'Desert Mirage',
  'Bio-Gooey',
  'Memphis Pop'
]

const PRESET_META: Record<string, { fonts: string; radius: string; swatches: string[] }> = {
  'the-bridge': { fonts: 'Default', radius: '12px', swatches: ['#0ea5e9'] },
  synthwave: { fonts: 'Orbitron / Inter / IBM Plex Mono', radius: '6px', swatches: ['#ff2bd6', '#19fff2', '#ff8a00'] },
  vaporwave: { fonts: 'Playfair Display / Inter', radius: '12px', swatches: ['#ffb3c7', '#9ad6ff', '#a6ffc9'] },
  'neon-noir': { fonts: 'Archivo Condensed / Inter', radius: '8px', swatches: ['#ff2fa1', '#00e5ff', '#ffe500'] },
  glitchcore: { fonts: 'Chakra Petch / Space Grotesk / JetBrains Mono', radius: '4px', swatches: ['#00ffff', '#ff00ff', '#b6ff00'] },
  retrofuturism: { fonts: 'Montserrat / Source Sans 3', radius: '12px', swatches: ['#2bb1a6', '#f2c14e', '#f24444'] },
  solarpunk: { fonts: 'Nunito / Inter', radius: '10px', swatches: ['#58c17b', '#69cbe2', '#f5c84c'] },
  brutalism: { fonts: 'Archivo Black / Inter', radius: '0px', swatches: ['#000000', '#ffffff', '#1a73e8'] },
  'matrix-aesthetic': { fonts: 'IBM Plex Mono / Inter', radius: '4px', swatches: ['#00ff41', '#a8ff60', '#00e5ff'] },
  'monospace-terminal': { fonts: 'JetBrains Mono', radius: '2px', swatches: ['#0e1116', '#39c5bb', '#ffd866'] },
  hyperpop: { fonts: 'Fredoka / Rubik', radius: '16px', swatches: ['#ff3eb5', '#3bffff', '#c9ff2f'] },
  'corporate-swiss': { fonts: 'Helvetica Neue / Inter / IBM Plex Mono', radius: '0px', swatches: ['#e0002b', '#0066ff', '#111111'] },
  'gothic-baroque': { fonts: 'Playfair Display / EB Garamond', radius: '2px', swatches: ['#5a0e1b', '#d4af37', '#0b0b0b'] },
  'desert-mirage': { fonts: 'Lora / Karla', radius: '14px', swatches: ['#c8683d', '#f1e3c6', '#7a9e82'] },
  'bio-gooey': { fonts: 'Poppins / Inter', radius: '28px', swatches: ['#a6f1cf', '#d6c3ff', '#b6e2ff'] },
  'memphis-pop': { fonts: 'Bungee / Work Sans', radius: '8px', swatches: ['#00c7ff', '#ff2f92', '#ffd400'] },
}

function toKey(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function ThemesPage() {
  const router = useRouter()
  const { themePreset, setThemePreset } = useTheme()
  const [active, setActive] = useState<string>(themePreset || 'the-bridge')

  const items = useMemo(() => PRESETS.map(name => ({
    name,
    key: toKey(name)
  })), [])

  const applyPreset = (key: string) => {
    setActive(key)
    setThemePreset(key)
  }

  return (
    <>
      <Head>
        <title>Theme Presets - The Bridge</title>
      </Head>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/settings')}
                className="theme-outline-btn flex items-center gap-2 px-3 py-2 text-sm"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Settings
              </button>

              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Palette className="w-5 h-5" />
                Theme Presets
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Choose a Theme</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">Pick a theme preset, then combine it with light/dark and a color scheme in Appearance.</p>

            <div className="divide-y divide-gray-200 dark:divide-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              {items.map(({ name, key }) => (
                <div key={key} className="group relative flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">{name}{key === 'the-bridge' ? ' (Default)' : ''}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">/{key}</div>
                  </div>

                  {active === key ? (
                    <span className="inline-flex items-center gap-1 text-primary-600 dark:text-primary-400 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      Applied
                    </span>
                  ) : (
                    <button
                      onClick={() => applyPreset(key)}
                      className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Apply
                    </button>
                  )}

                  <div className="absolute right-4 top-full mt-2 hidden group-hover:block z-10">
                    <div className="w-80 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-xl bg-white dark:bg-gray-900">
                      <div className={`h-24 w-full preset-preview preset-${key}`} />
                      <div className="p-3">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Preview</div>
                        <div className="mt-2 flex items-center gap-2">
                          {(PRESET_META[key]?.swatches || []).slice(0, 3).map((c) => (
                            <span key={c} className="h-4 w-4 rounded-full border border-gray-200 dark:border-gray-700" style={{ backgroundColor: c }} />
                          ))}
                          <span className="text-xs text-gray-500 dark:text-gray-400">Radius: {PRESET_META[key]?.radius || '—'}</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">Fonts: {PRESET_META[key]?.fonts || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Tip: Hover a theme to preview its palette, radius and typography.
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
