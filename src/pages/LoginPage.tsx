/*
  WHY THIS FILE EXISTS:
  The login page is a frontend-only MVP. It exists purely to give the app a
  realistic entry point — the kind of gate users expect before accessing a
  streaming service. No credentials are validated, stored, or sent anywhere.
  Pressing "Sign In" with any input navigates directly to the Home page.

  STATE USED:
  - useState (local): email, password, isLoading — all ephemeral form state
    that only this component cares about. Nothing persists, nothing is shared.
    Classic local-state use case.

  WHY NOT Zustand for "isLoggedIn":
  There's no real auth. Storing a boolean in Zustand would imply it means
  something — it doesn't. The route itself acts as the "gate": if you're on
  /home, you're "in". No auth state needed.
*/

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate a brief loading state for realism — no actual request is made
    setIsLoading(true)
    setTimeout(() => {
      navigate('/')
    }, 800)
  }

  return (
    <div
      className="min-h-screen bg-black flex flex-col"
      style={{
        backgroundImage: 'url(https://assets.nflxext.com/ffe/siteui/vlv3/71f3b7c7-b921-41e5-bc39-e9394e1e3b6e/web/IN-en-20250303-TRIFECTA-perspective_37fbf9b3-8b2b-4fa8-a1fe-e3b0df6d9c35_large.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Header */}
      <header className="relative z-10 px-6 sm:px-16 py-6">
        <span className="text-netflix-red font-bold text-3xl tracking-tight select-none">
          NETFLIX
        </span>
      </header>

      {/* Form card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm bg-black/75 rounded-md px-8 py-12 backdrop-blur-sm">
          <h1 className="text-white text-3xl font-bold mb-8">Sign In</h1>

          <form onSubmit={handleSignIn} noValidate className="flex flex-col gap-4">
            <div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email or phone number"
                autoComplete="email"
                className="w-full bg-[#333] text-white placeholder-netflix-gray rounded px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            <div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                className="w-full bg-[#333] text-white placeholder-netflix-gray rounded px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-netflix-red text-white font-bold py-4 rounded text-sm mt-2 hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Footer links — static UI only */}
          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                defaultChecked
                className="accent-netflix-gray"
              />
              <span className="text-netflix-gray text-sm">Remember me</span>
            </label>
            <button type="button" className="text-netflix-gray text-sm hover:underline">
              Need help?
            </button>
          </div>

          <p className="text-netflix-gray text-sm mt-10">
            New to Netflix?{' '}
            <button type="button" className="text-white font-semibold hover:underline">
              Sign up now
            </button>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 sm:px-16 py-8 border-t border-white/10">
        <p className="text-netflix-gray text-xs">
          Questions? Call 000-800-919-1694
        </p>
      </footer>
    </div>
  )
}
