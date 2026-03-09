import Link from 'next/link'
import Image from 'next/image'

interface EspritLogoProps {
  className?: string
  showTagline?: boolean
  compact?: boolean
  theme?: 'auto' | 'light' | 'dark'
}

export function EspritLogo({ className = '', showTagline = true, compact = false, theme = 'auto' }: EspritLogoProps) {
  const dimensions = compact
    ? { width: 220, height: 72, className: 'h-12 w-auto max-w-[210px]' }
    : { width: 380, height: 116, className: 'h-24 w-auto max-w-[380px]' }

  const wrapperClass = compact
    ? 'inline-flex min-w-0 items-center rounded-xl px-1 py-1'
    : 'inline-flex min-w-0 items-center rounded-2xl px-2 py-2'

  const lightWrapper = compact
    ? `${wrapperClass} bg-white shadow-[0_14px_34px_-18px_rgba(0,0,0,0.32)] ring-1 ring-black/5`
    : `${wrapperClass} bg-white/98 shadow-[0_18px_38px_-18px_rgba(0,0,0,0.22)] ring-1 ring-black/5`

  const darkWrapper = compact
    ? `${wrapperClass} bg-transparent`
    : `${wrapperClass} bg-transparent`

  const lightLogo = (
    <span className={lightWrapper}>
      <Image
        src="/esprit-logo.svg"
        alt="ESPRIT"
        width={dimensions.width}
        height={dimensions.height}
        priority
        className={dimensions.className}
      />
    </span>
  )

  const darkLogo = (
    <span className={darkWrapper}>
      <Image
        src="/esprit-logo-dark.svg"
        alt="ESPRIT"
        width={dimensions.width}
        height={dimensions.height}
        priority
        className={dimensions.className}
      />
    </span>
  )

  return (
    <Link href="/" className={`inline-flex min-w-0 items-center justify-center ${className}`}>
      {theme === 'light' && lightLogo}
      {theme === 'dark' && darkLogo}
      {theme === 'auto' && (
        <>
          <span className="dark:hidden">{lightLogo}</span>
          <span className="hidden dark:inline-flex">{darkLogo}</span>
        </>
      )}
      {!compact && (
        <span className="sr-only">
          ESPRIT {showTagline ? '- Se former autrement' : ''}
        </span>
      )}
    </Link>
  )
}
