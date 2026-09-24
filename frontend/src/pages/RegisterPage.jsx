import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

// The same pattern the backend uses in validateRegister.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Same rules as validateRegister in the backend. The password limit is 72 bytes, not characters,
// because bcrypt ignores anything after 72 bytes; TextEncoder counts the bytes like the backend does.
function validate(values) {
  const errors = {}
  const name = values.name.trim()
  const email = values.email.trim()
  const passwordBytes = new TextEncoder().encode(values.password).length

  if (!name) {
    errors.name = 'Name is required'
  } else if (name.length < 2 || name.length > 50) {
    errors.name = 'Name must be between 2 and 50 characters'
  }

  if (!email) {
    errors.email = 'Email is required'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'A valid email is required'
  }

  if (!values.password) {
    errors.password = 'Password is required'
  } else if (values.password.length < 8 || passwordBytes > 72) {
    errors.password = 'Password must be between 8 and 72 characters'
  }

  return errors
}

function RegisterPage() {
  const { register } = useAuth()
  const { showSuccess } = useToast()
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(event) {
    setValues({ ...values, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setSubmitting(true)
    try {
      // Registering does not log the user in, so they are sent to the login page.
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      showSuccess('Account created. Please log in.')
      navigate('/login')
    } catch (error) {
      // Field errors go under their fields; anything else (e.g. 409 duplicate email) goes on top.
      if (error.errors) {
        setErrors(error.errors)
      } else {
        setFormError(error.message)
      }
      setSubmitting(false)
    }
  }

  return (
    <AuthCard title="Create an account">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <ErrorMessage message={formError} />}

        <div>
          <label htmlFor="name" className="form-label">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className="form-input"
            value={values.name}
            onChange={handleChange}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name && (
            <p id="name-error" className="form-error">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="form-input"
            value={values.email}
            onChange={handleChange}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="form-error">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            className="form-input"
            value={values.password}
            onChange={handleChange}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <p id="password-error" className="form-error">
              {errors.password}
            </p>
          )}
        </div>

        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthCard>
  )
}

export default RegisterPage
