import type { ImgHTMLAttributes } from 'react'

type AvatarProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt'> & {
  alt: string
  name?: string
  online?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ alt, className = '', name, online = false, size = 'md', src, ...props }: AvatarProps) {
  const initials = name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  return (
    <span className={['avatar', `avatar--${size}`, className].filter(Boolean).join(' ')}>
      {src ? <img alt={alt} src={src} {...props} /> : <span aria-label={alt}>{initials || '?'}</span>}
      {online && <span aria-label="Online" className="avatar__status" />}
    </span>
  )
}
