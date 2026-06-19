import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form.username, form.email, form.password)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <span className="font-mono text-amber text-lg font-medium tracking-tight">
            collab<span className="text-text">app</span>
          </span>
          <h1 className="text-2xl font-semibold mt-4 mb-1">Create account</h1>
          <p className="text-subtle text-sm">Start collaborating in seconds</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-subtle block mb-1.5">Username</label>
            <input className="input" placeholder="yourname" value={form.username} onChange={set('username')} required />
          </div>
          <div>
            <label className="text-xs text-subtle block mb-1.5">Email</label>
            <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
          </div>
          <div>
            <label className="text-xs text-subtle block mb-1.5">Password</label>
            <input className="input" type="password" placeholder="min 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
          </div>

          {error && (
            <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-subtle mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-amber hover:text-amber/80 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
