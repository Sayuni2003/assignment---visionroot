import { LABELS } from '../constants.js'

// A labelled select with an "All" option (value '') followed by the given values.
function FilterSelect({ id, label, value, options, onChange }) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <select id={id} className="form-input" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {LABELS[option]}
          </option>
        ))}
      </select>
    </div>
  )
}

export default FilterSelect
