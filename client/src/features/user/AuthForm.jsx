import { useState } from 'react'
import useUser from './useUser'

export default function AuthForm({ onClose }) {
  const { signInWithEmail, loading } = useUser()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    const { error } = await signInWithEmail(email)
    if (error) {
      setMessage('Erreur lors de l’envoi du lien. Vérifiez votre email.')
    } else {
      setMessage('Lien envoyé — vérifiez votre boîte email.')
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{ fontSize: 13 }}>Email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
        style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }}
      />

      <button type="submit" disabled={loading} style={{ padding: '8px 10px', borderRadius: 8, background: '#0a6cff', color: 'white', border: 'none' }}>
        {loading ? 'Envoi...' : 'Se connecter'}
      </button>

      {message && <div style={{ fontSize: 13 }}>{message}</div>}

      <div style={{ fontSize: 12, color: '#6b7280' }}>Nous utilisons un lien magique — pas de mot de passe.</div>
    </form>
  )
}
