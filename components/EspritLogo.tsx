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
    ? { width: 48, height: 48, className: 'h-12 w-12' }
    : { width: 96, height: 96, className: 'h-24 w-24' }

  const wrapperClass = compact
    ? 'inline-flex min-w-0 items-center overflow-hidden rounded-xl'
    : 'inline-flex min-w-0 items-center overflow-hidden rounded-2xl'

  const lightLogo = (
    <span className={wrapperClass}>
      <Image
        src="/logolight.png"
        alt="ESPRIT"
        width={dimensions.width}
        height={dimensions.height}
        priority
        className={dimensions.className}
      />
    </span>
  )

  const darkLogo = (
    <span className={wrapperClass}>
      <Image
        src="/logonight.png"
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
