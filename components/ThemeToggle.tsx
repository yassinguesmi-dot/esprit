'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className={`border-border bg-card text-foreground ${className}`.trim()}
        aria-label="Changer le thème"
      >
        <span className="text-base">◐</span>
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={`border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground ${className}`.trim()}
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode nuit'}
      title={isDark ? 'Mode clair' : 'Mode nuit'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      <span className="text-base">{isDark ? '☀️' : '🌙'}</span>
    </Button>
  )
}