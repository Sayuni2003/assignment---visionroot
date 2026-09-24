import { useState } from 'react'
import { CATEGORIES, LABELS, PRIORITIES } from '../constants.js'
import ErrorMessage from './ErrorMessage.jsx'

// The same limits as backend/src/validators/request.validator.js, checked here for quick feedback.
function validate(values) {
  const errors = {}
  const title = values.title.trim()
  const description = values.description.trim()

  if (title.length < 3 || title.length > 100) {
    errors.title = 'Title must be between 3 and 100 characters'
  }

  if (description.length < 10 || description.length > 2000) {
    errors.description = 'Description must be between 10 and 2000 characters'
  }

  if (!values.category) {
    errors.category = 'Please choose a category'
  }

  return errors
}

// Used by both the create and edit pages. `onSubmit` receives the trimmed values;
// if it throws, the backend's field errors (or its message) are shown in the form.
function RequestForm({ initialValues = {}, onSubmit, submitLabel }) {
  const [values, setValues] = useState({
    title: initialValues.title ?? '',
    description: initialValues.description ?? '',
    category: initialValues.category ?? '',
    priority: initialValues.priority ?? 'MEDIUM',
  })
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
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        priority: values.priority,
      })
    } catch (error) {
      if (error.errors) {
        setErrors(error.errors)
      } else {
        setFormError(error.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-lg border bg-bg-card p-4 sm:p-6">
      {formError && <ErrorMessage message={formError} />}

      <div>
        <label htmlFor="title" className="form-label">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          className="form-input"
          value={values.title}
          onChange={handleChange}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
        />
        {errors.title && (
          <p id="title-error" className="form-error">
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="form-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          className="form-input"
          value={values.description}
          onChange={handleChange}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className="form-error">
            {errors.description}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="form-label">
            Category
          </label>
          <select
            id="category"
            name="category"
            className="form-input"
            value={values.category}
            onChange={handleChange}
            aria-invalid={Boolean(errors.category)}
            aria-describedby={errors.category ? 'category-error' : undefined}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {LABELS[category]}
              </option>
            ))}
          </select>
          {errors.category && (
            <p id="category-error" className="form-error">
              {errors.category}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="priority" className="form-label">
            Priority
          </label>
          <select
            id="priority"
            name="priority"
            className="form-input"
            value={values.priority}
            onChange={handleChange}
            aria-invalid={Boolean(errors.priority)}
            aria-describedby={errors.priority ? 'priority-error' : undefined}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {LABELS[priority]}
              </option>
            ))}
          </select>
          {errors.priority && (
            <p id="priority-error" className="form-error">
              {errors.priority}
            </p>
          )}
        </div>
      </div>

      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={submitting}>
        {submitting ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}

export default RequestForm
