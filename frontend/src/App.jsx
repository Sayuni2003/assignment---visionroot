import { useState } from 'react'
import { API_URL, getHealth } from './services/api.js'

function App() {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleCheck() {
    setStatus('loading')
    try {
      const data = await getHealth()
      setStatus('ok')
      setMessage(data.message)
    } catch (error) {
      setStatus('error')
      setMessage(error.message)
    }
  }

  return (
    <main className="app">
      <h1>Service Request Management System</h1>
      <p>Frontend is running.</p>

      <section className="health">
        <p>
          API URL: <code>{API_URL || 'VITE_API_URL is not set'}</code>
        </p>
        <button type="button" onClick={handleCheck} disabled={status === 'loading'}>
          {status === 'loading' ? 'Checking…' : 'Check API health'}
        </button>
        {status === 'ok' && <p className="ok">Backend reachable: {message}</p>}
        {status === 'error' && <p className="error">Backend unreachable: {message}</p>}
      </section>
    </main>
  )
}

export default App
