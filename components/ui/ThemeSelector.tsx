'use client'
import { THEME_COLORS } from '@/types'
import type { ThemeColor } from '@/types'
import { useAppStore } from '@/store/appStore'

const themes: ThemeColor[] = ['healing-blue', 'energetic-pink', 'minimal-black', 'forest-green', 'sunset-orange', 'lavender']

export function ThemeSelector({ compact = false }: { compact?: boolean }) {
  const { config, setConfig } = useAppStore()

  return (
    <div className="flex flex-wrap gap-2">
      {themes.map((theme) => {
        const t = THEME_COLORS[theme]
        const isActive = config.themeColor === theme
        return (
          <button
            key={theme}
            onClick={() => setConfig({ themeColor: theme })}
            className={`relative rounded-full transition-all duration-300 ${
              compact ? 'w-8 h-8' : 'w-10 h-10'
            } ${isActive ? 'scale-110 ring-2 ring-offset-2' : 'hover:scale-105'}`}
            style={{
              background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})`,
              outline: isActive ? `2px solid ${t.primary}` : undefined
            }}
            title={t.label}
          >
            {isActive && (
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                ✓
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
