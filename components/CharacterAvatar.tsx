// components/CharacterAvatar.tsx
'use client'

interface CharacterAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function CharacterAvatar({ size = 'lg', className = '' }: CharacterAvatarProps) {
  const sizeMap = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-28 h-28',
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden bg-gradient-to-tr from-zinc-100 via-white to-zinc-50 border-2 border-zinc-200 shadow-sm ${sizeMap[size]} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Soft background */}
        <circle cx="50" cy="50" r="48" fill="#F4F4F5" />

        {/* Back hair */}
        <path
          d="M20 52C16 35 24 16 50 16C76 16 84 35 80 52C82 66 76 82 72 88C64 88 58 82 50 82C42 82 36 88 28 88C24 82 18 66 20 52Z"
          fill="#4A3E3D"
        />

        {/* Ears */}
        <circle cx="28" cy="52" r="7" fill="#FCD5CE" />
        <circle cx="72" cy="52" r="7" fill="#FCD5CE" />

        {/* Face */}
        <path
          d="M28 50C28 66 38 78 50 78C62 78 72 66 72 50C72 38 62 30 50 30C38 30 28 38 28 50Z"
          fill="#FFE8D6"
        />

        {/* Front hair bangs */}
        <path
          d="M26 42C30 32 40 24 50 24C60 24 70 32 74 42C70 42 66 36 60 38C55 36 52 40 48 38C44 40 40 36 36 39C32 38 29 42 26 42Z"
          fill="#4A3E3D"
        />
        <path
          d="M24 45C22 55 24 64 26 70C28 66 28 58 30 50C27 48 25 46 24 45Z"
          fill="#4A3E3D"
        />
        <path
          d="M76 45C78 55 76 64 74 70C72 66 72 58 70 50C73 48 75 46 76 45Z"
          fill="#4A3E3D"
        />

        {/* Hair ribbon/clip */}
        <circle cx="68" cy="34" r="5" fill="#E11D48" />
        <path d="M68 34L74 30L73 38Z" fill="#F43F5E" />
        <path d="M68 34L74 38L73 30Z" fill="#FB7185" />

        {/* Cute blush */}
        <ellipse cx="36" cy="58" rx="4.5" ry="2.5" fill="#FDA4AF" opacity="0.7" />
        <ellipse cx="64" cy="58" rx="4.5" ry="2.5" fill="#FDA4AF" opacity="0.7" />

        {/* Glasses frames */}
        <rect
          x="30"
          y="46"
          width="16"
          height="14"
          rx="5"
          fill="none"
          stroke="#52525B"
          strokeWidth="2.2"
        />
        <rect
          x="54"
          y="46"
          width="16"
          height="14"
          rx="5"
          fill="none"
          stroke="#52525B"
          strokeWidth="2.2"
        />
        {/* Glasses bridge */}
        <path d="M46 52H54" stroke="#52525B" strokeWidth="2.2" strokeLinecap="round" />

        {/* Eyes inside glasses */}
        <circle cx="38" cy="53" r="2.8" fill="#27272A" />
        <circle cx="62" cy="53" r="2.8" fill="#27272A" />
        <circle cx="37" cy="51.8" r="1" fill="#FFFFFF" />
        <circle cx="61" cy="51.8" r="1" fill="#FFFFFF" />

        {/* Smile */}
        <path
          d="M47 62C48 64 52 64 53 62"
          stroke="#E11D48"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Hand making peace sign */}
        <circle cx="70" cy="74" r="6" fill="#FFE8D6" stroke="#FCD5CE" strokeWidth="1" />
        <path
          d="M68 70L66 63M71 70L73 62"
          stroke="#FFE8D6"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
