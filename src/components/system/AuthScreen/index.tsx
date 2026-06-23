'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/supabase/AuthContext'
import { Z } from '@/lib/constants'

// CrimeOS officer authentication. Shown INSTEAD of the boot sequence when
// Supabase is configured and no session exists. Magic-link (passwordless)
// email login styled to match the Win95 PIN dialog (see LoginScreen.tsx).
//
// A "continue as guest" escape hatch is offered so the app never hard-bricks
// when the player doesn't want a cloud account — guest mode plays against
// localStorage exactly as before. When Supabase is NOT configured this screen
// is skipped entirely upstream (see Desktop), so it never blocks an offline
// install.

const ARIAL = 'Arial, sans-serif'

export default function AuthScreen({ onGuest }: { onGuest: () => void }) {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const trimmed = email.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await signInWithEmail(trimmed)
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#008080',
        zIndex: Z.loginScreen,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Win95 dialog box */}
      <div
        style={{
          background: '#c0c0c0',
          borderStyle: 'solid',
          borderWidth: 3,
          borderColor: '#ffffff #404040 #404040 #ffffff',
          boxShadow: '4px 4px 0 #000000',
          width: 380,
        }}
      >
        {/* Titlebar */}
        <div
          style={{
            background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
            padding: '4px 4px 4px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 'bold',
            fontFamily: ARIAL,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path
              d="M7,1 L13,3.5 L13,8 Q13,12 7,13.5 Q1,12 1,8 L1,3.5 Z"
              fill="#c8a000"
              stroke="#ffffff"
              strokeWidth="0.5"
            />
            <circle cx="7" cy="8" r="2.5" fill="#ffffff" />
          </svg>
          <span style={{ flex: 1 }}>CRIMEOS — OFFICER AUTHENTICATION</span>
          {/* Decorative window controls */}
          <div style={{ display: 'flex', gap: 2 }}>
            <TitleBtn label="_" />
            <TitleBtn label="□" />
            <TitleBtn label="✕" />
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <LoginBadge />
            <div>
              <p style={{ fontSize: 13, fontWeight: 'bold', fontFamily: ARIAL, color: '#000000', marginBottom: 4 }}>
                Jacksonville Police Department
              </p>
              <p style={{ fontSize: 11, fontFamily: ARIAL, color: '#444444' }}>
                Municipal Database System
              </p>
              <p style={{ fontSize: 10, fontFamily: ARIAL, color: '#808080', marginTop: 4 }}>
                Sign in to sync your case progress across devices.
              </p>
            </div>
          </div>

          <div style={{ height: 0, borderTop: '1px solid #808080', borderBottom: '1px solid #ffffff' }} />

          {sent ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, fontFamily: ARIAL, color: '#000000', margin: 0, lineHeight: 1.5 }}>
                ✓ Check your email. We sent a sign-in link to{' '}
                <b>{email.trim()}</b>. Open it on any device to access your
                badge.
              </p>
              <p style={{ fontSize: 11, fontFamily: ARIAL, color: '#808080', margin: 0 }}>
                You can close this window once you&apos;ve clicked the link.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <Win95Btn onClick={() => setSent(false)}>Use a different email</Win95Btn>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 12, fontFamily: ARIAL, color: '#000000', width: 80, flexShrink: 0 }}>
                  Email:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !busy) submit()
                  }}
                  autoFocus
                  placeholder="officer@jpd.gov"
                  style={{
                    flex: 1,
                    height: 22,
                    background: '#ffffff',
                    borderStyle: 'solid',
                    borderWidth: 2,
                    borderColor: '#808080 #ffffff #ffffff #808080',
                    padding: '0 6px',
                    fontSize: 12,
                    fontFamily: ARIAL,
                    color: '#000000',
                    outline: 'none',
                  }}
                />
              </div>

              {error && (
                <p style={{ fontSize: 11, fontFamily: ARIAL, color: '#cc0000', margin: 0 }}>
                  ⚠ {error}
                </p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <Win95Btn onClick={submit} disabled={busy} bold>
                  {busy ? 'Sending…' : 'Send Magic Link'}
                </Win95Btn>
                <Win95Btn onClick={onGuest}>Continue as Guest</Win95Btn>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function TitleBtn({ label }: { label: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: 16,
        height: 14,
        background: '#c0c0c0',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#ffffff #404040 #404040 #ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9,
        color: '#000000',
        fontFamily: ARIAL,
        lineHeight: 1,
      }}
    >
      {label}
    </span>
  )
}

function LoginBadge() {
  return (
    <svg width="52" height="58" viewBox="0 0 100 110" aria-label="JPD Badge" style={{ flexShrink: 0 }}>
      <path d="M50,4 L90,20 L90,60 Q90,90 50,106 Q10,90 10,60 L10,20 Z" fill="#000080" stroke="#c0c0c0" strokeWidth="3" />
      <path d="M50,12 L82,26 L82,60 Q82,84 50,98 Q18,84 18,60 L18,26 Z" fill="none" stroke="#aaaaff" strokeWidth="1.5" />
      <circle cx="50" cy="55" r="14" fill="#c8a000" stroke="#ffdd44" strokeWidth="1" />
      <polygon points="50,41 53,51 64,51 55,58 58,68 50,62 42,68 45,58 36,51 47,51" fill="#ffffff" />
      <text x="50" y="33" textAnchor="middle" fill="#ffffff" fontSize="10" fontFamily="Arial" fontWeight="bold" letterSpacing="3">JPD</text>
      <text x="50" y="82" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="Arial" letterSpacing="2">POLICE</text>
      <text x="50" y="92" textAnchor="middle" fill="#aaaaff" fontSize="5.5" fontFamily="Arial" letterSpacing="1">JACKSONVILLE</text>
    </svg>
  )
}

function Win95Btn({
  children,
  onClick,
  disabled,
  bold,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  bold?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: '#c0c0c0',
        borderStyle: 'solid',
        borderWidth: 2,
        borderColor: disabled
          ? '#c0c0c0 #c0c0c0 #c0c0c0 #c0c0c0'
          : '#ffffff #404040 #404040 #ffffff',
        padding: '3px 16px',
        fontSize: 12,
        fontFamily: ARIAL,
        fontWeight: bold ? 'bold' : 'normal',
        color: disabled ? '#808080' : '#000000',
        cursor: disabled ? 'default' : 'pointer',
        minWidth: 72,
      }}
    >
      {children}
    </button>
  )
}
