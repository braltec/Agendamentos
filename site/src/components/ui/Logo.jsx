export default function Logo({ size = 'md', variant = 'full' }) {
  const sizes = {
    sm: { container: 'h-8', text: 'text-base' },
    md: { container: 'h-12', text: 'text-2xl' },
    lg: { container: 'h-20', text: 'text-4xl' },
    xl: { container: 'h-32', text: 'text-6xl' }
  }

  const sizeClasses = sizes[size] || sizes.md

  if (variant === 'icon') {
    return (
      <div className={`${sizeClasses.container} aspect-square flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Balão de fala com circuitos AI */}
          <defs>
            <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          
          {/* Balão de fala */}
          <path
            d="M 20 30 Q 20 15 35 15 L 75 15 Q 90 15 90 30 L 90 60 Q 90 75 75 75 L 40 75 L 25 90 L 25 75 Q 20 75 20 60 Z"
            fill="url(#aiGradient)"
          />
          
          {/* Circuitos AI */}
          <g stroke="white" strokeWidth="2" fill="none">
            <circle cx="40" cy="40" r="4" fill="white" />
            <circle cx="60" cy="40" r="4" fill="white" />
            <circle cx="50" cy="55" r="4" fill="white" />
            <line x1="40" y1="40" x2="50" y2="55" />
            <line x1="60" y1="40" x2="50" y2="55" />
            <line x1="35" y1="35" x2="40" y2="40" />
            <line x1="65" y1="35" x2="60" y2="40" />
          </g>
        </svg>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {/* Ícone */}
      <div className={`${sizeClasses.container} aspect-square flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          
          {/* Balão de fala */}
          <path
            d="M 20 30 Q 20 15 35 15 L 75 15 Q 90 15 90 30 L 90 60 Q 90 75 75 75 L 40 75 L 25 90 L 25 75 Q 20 75 20 60 Z"
            fill="url(#aiGradient)"
          />
          
          {/* Circuitos AI */}
          <g stroke="white" strokeWidth="2.5" fill="none">
            <circle cx="40" cy="40" r="4" fill="white" />
            <circle cx="60" cy="40" r="4" fill="white" />
            <circle cx="50" cy="55" r="4" fill="white" />
            <line x1="40" y1="40" x2="50" y2="55" />
            <line x1="60" y1="40" x2="50" y2="55" />
            <line x1="35" y1="35" x2="40" y2="40" />
            <line x1="65" y1="35" x2="60" y2="40" />
          </g>
        </svg>
      </div>

      {/* Texto */}
      <div className={`${sizeClasses.text} font-bold leading-none`}>
        <span className="text-emerald-500">AI</span>
        <span className="text-slate-700">Resolve</span>
      </div>
    </div>
  )
}








