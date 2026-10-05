import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Trail } from './Icons'

type Props = { children: ReactNode; href?: string; type?: 'button' | 'submit'; className?: string; onClick?: () => void; disabled?: boolean }

// Outlined button: corner ticks draw into a full frame on hover while the label slides out
// and an arrow trail slides in.
export function Cta({ children, href, type = 'button', className = '', onClick, disabled }: Props) {
  const inner = (
    <>
      <span className="cta-corner tl" aria-hidden />
      <span className="cta-label">{children}</span>
      <Trail className="cta-trail" />
      <span className="cta-corner br" aria-hidden />
    </>
  )
  if (href?.startsWith('/'))
    return (
      <Link className={`cta ${className}`} to={href}>
        {inner}
      </Link>
    )
  return href ? (
    <a className={`cta ${className}`} href={href}>
      {inner}
    </a>
  ) : (
    <button className={`cta ${className}`} type={type} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  )
}
