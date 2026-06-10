'use client'

import { useEffect, useState } from 'react'
import { useSessionStore, SESSION_PIN } from '@/store/useSessionStore'
import { Z } from '@/lib/constants'

export default function LoginScreen() {
  const unlock = useSessionStore((s) => s.unlock)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  const submit = () => {
    if (!unlock(password)) {
      setError('The password is incorrect. Please try again.')
      setShake(true)
      setTimeout(() => { setShake(false); setPassword(''); setError('') }, 1500)
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') submit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password])

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
          width: 340,
          transform: shake ? 'translateX(-6px)' : 'translateX(0)',
          transition: shake ? 'none' : 'transform 0.05s',
        }}
      >
        {/* Dialog titlebar */}
        <div style={{
          background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: '#ffffff',
          fontSize: 12,
          fontWeight: 'bold',
          fontFamily: 'Arial, sans-serif',
        }}>
          {/* Tiny shield icon in titlebar */}
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M7,1 L13,3.5 L13,8 Q13,12 7,13.5 Q1,12 1,8 L1,3.5 Z" fill="#c8a000" stroke="#ffffff" strokeWidth="0.5" />
            <circle cx="7" cy="8" r="2.5" fill="#ffffff" />
          </svg>
          JPD CrimeOS — Begin Logon
        </div>

        {/* Dialog body */}
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Badge + welcome text */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <LoginBadge />
            <div>
              <p style={{ fontSize: 13, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', color: '#000000', marginBottom: 4 }}>
                Jacksonville Police Department
              </p>
              <p style={{ fontSize: 11, fontFamily: 'Arial, sans-serif', color: '#444444' }}>
                Municipal Database System
              </p>
              <p style={{ fontSize: 10, fontFamily: 'Arial, sans-serif', color: '#808080', marginTop: 4 }}>
                Authorized personnel only.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 0, borderTop: '1px solid #808080', borderBottom: '1px solid #ffffff' }} />

          {/* Username row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, fontFamily: 'Arial, sans-serif', color: '#000000', width: 80, flexShrink: 0 }}>
              User name:
            </label>
            <input
              readOnly
              value="Detective"
              style={{
                flex: 1, height: 22,
                background: '#c0c0c0',
                borderStyle: 'solid', borderWidth: 2,
                borderColor: '#808080 #ffffff #ffffff #808080',
                padding: '0 6px', fontSize: 12,
                fontFamily: 'Arial, sans-serif', color: '#444444',
                outline: 'none',
              }}
            />
          </div>

          {/* Password row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 12, fontFamily: 'Arial, sans-serif', color: '#000000', width: 80, flexShrink: 0 }}>
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              style={{
                flex: 1, height: 22,
                background: '#ffffff',
                borderStyle: 'solid', borderWidth: 2,
                borderColor: '#808080 #ffffff #ffffff #808080',
                padding: '0 6px', fontSize: 12,
                fontFamily: 'Arial, sans-serif', color: '#000000',
                outline: 'none',
              }}
            />
          </div>

          {/* Error message */}
          {error && (
            <p style={{ fontSize: 11, fontFamily: 'Arial, sans-serif', color: '#cc0000', margin: 0 }}>
              ⚠ {error}
            </p>
          )}

          {/* Hint */}
          <p style={{ fontSize: 10, fontFamily: 'Arial, sans-serif', color: '#808080', margin: 0 }}>
            Hint: PIN is {SESSION_PIN}
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <LoginBtn onClick={submit}>OK</LoginBtn>
            <LoginBtn onClick={() => setPassword('')}>Cancel</LoginBtn>
          </div>
        </div>
      </div>
    </div>
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

function LoginBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#c0c0c0',
        borderStyle: 'solid', borderWidth: 2,
        borderColor: '#ffffff #404040 #404040 #ffffff',
        padding: '3px 20px',
        fontSize: 12, fontFamily: 'Arial, sans-serif',
        color: '#000000', cursor: 'default', minWidth: 72,
      }}
    >
      {children}
    </button>
  )
}
