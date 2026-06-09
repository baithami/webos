'use client'

// Win95 window-control buttons (minimize / maximize / close) — three small
// raised squares at the right of the titlebar. They stop pointer-down from
// reaching the titlebar drag handler so clicking a button never starts a drag.

interface Props {
  onClose: () => void
  onMinimize: () => void
  onMaximize: () => void
}

export default function Win95TitleButtons({ onClose, onMinimize, onMaximize }: Props) {
  return (
    <div className="flex items-center shrink-0" style={{ gap: 2 }}>
      <TitleBtn onClick={onMinimize} aria-label="Minimize">
        <svg width="8" height="8" viewBox="0 0 8 8">
          <rect x="1" y="6" width="6" height="1.5" fill="black" />
        </svg>
      </TitleBtn>
      <TitleBtn onClick={onMaximize} aria-label="Maximize">
        <svg width="8" height="8" viewBox="0 0 8 8">
          <rect x="1" y="1" width="6" height="6" stroke="black" strokeWidth="1.5" fill="none" />
          <rect x="1" y="1" width="6" height="2" fill="black" />
        </svg>
      </TitleBtn>
      <TitleBtn onClick={onClose} aria-label="Close" style={{ marginLeft: 2 }}>
        <svg width="8" height="8" viewBox="0 0 8 8">
          <line x1="1.5" y1="1.5" x2="6.5" y2="6.5" stroke="black" strokeWidth="1.5" />
          <line x1="6.5" y1="1.5" x2="1.5" y2="6.5" stroke="black" strokeWidth="1.5" />
        </svg>
      </TitleBtn>
    </div>
  )
}

function TitleBtn({
  children,
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        width: 18,
        height: 16,
        background: '#c0c0c0',
        border: '2px solid',
        borderColor: '#ffffff #404040 #404040 #ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
        flexShrink: 0,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
