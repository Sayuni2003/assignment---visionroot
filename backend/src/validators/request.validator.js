import AppError from '../utils/AppError.js';
import { CATEGORIES, PRIORITIES, STATUSES } from '../constants/request.constants.js';

const SORT_FIELDS = ['createdAt', 'updatedAt'];
const SORT_ORDERS = ['asc', 'desc'];

function throwIfErrors(errors) {
  if (Object.keys(errors).length > 0) {
    throw new AppError(400, 'Validation failed', errors);
  }
}

function trimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// Shared by create and update. When `partial` is true a missing field is skipped instead of
// reported, so an update only has to send the fields it changes. Priority is optional in both.
function validateRequestFields(body, partial) {
  const { title, description, category, priority } = body ?? {};
  const errors = {};
  const cleaned = {};

  if (!partial || title !== undefined) {
    const trimmedTitle = trimmedString(title);
    if (trimmedTitle.length < 3 || trimmedTitle.length > 100) {
      errors.title = 'Title must be between 3 and 100 characters';
    } else {
      cleaned.title = trimmedTitle;
    }
  }

  if (!partial || description !== undefined) {
    const trimmedDescription = trimmedString(description);
    if (trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
      errors.description = 'Description must be between 10 and 2000 characters';
    } else {
      cleaned.description = trimmedDescription;
    }
  }

  if (!partial || category !== undefined) {
    if (!CATEGORIES.includes(category)) {
      errors.category = `Category must be one of: ${CATEGORIES.join(', ')}`;
    } else {
      cleaned.category = category;
    }
  }

  if (priority !== undefined) {
    if (!PRIORITIES.includes(priority)) {
      errors.priority = `Priority must be one of: ${PRIORITIES.join(', ')}`;
    } else {
      cleaned.priority = priority;
    }
  }

  throwIfErrors(errors);

  return cleaned;
}

// Each validator reads only the fields it knows about (so status, createdBy, _id and other extras
// are dropped) and returns the cleaned values, or throws a 400 AppError listing every invalid field.
export function validateCreateRequest(body) {
  return validateRequestFields(body, false);
}

export function validateUpdateRequest(body) {
  const { title, description, category, priority } = body ?? {};

  if ([title, description, category, priority].every((value) => value === undefined)) {
    throw new AppError(400, 'At least one field is required');
  }

  return validateRequestFields(body, true);
}

export function validateStatusUpdate(body) {
  const { status } = body ?? {};

  if (!STATUSES.includes(status)) {
    throw new AppError(400, 'Validation failed', {
      status: `Status must be one of: ${STATUSES.join(', ')}`,
    });
  }

  return { status };
}

// Query values arrive as strings. Returns the default when the value is absent, and null when it
// is not a whole number between min and max.
function parseInteger(value, defaultValue, min, max) {
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null;
  }
  const number = Number(value);
  return number >= min && number <= max ? number : null;
}

export function validateListQuery(query) {
  const { page, limit, search, sortBy, order } = query ?? {};
  const errors = {};

  const cleaned = {
    page: parseInteger(page, 1, 1, Number.MAX_SAFE_INTEGER),
    limit: parseInteger(limit, 10, 1, 50),
    sortBy: sortBy ?? 'createdAt',
    order: order ?? 'desc',
  };

  if (cleaned.page === null) {
    errors.page = 'Page must be a whole number of at least 1';
  }

  if (cleaned.limit === null) {
    errors.limit = 'Limit must be a whole number between 1 and 50';
  }

  if (!SORT_FIELDS.includes(cleaned.sortBy)) {
    errors.sortBy = `sortBy must be one of: ${SORT_FIELDS.join(', ')}`;
  }

  if (!SORT_ORDERS.includes(cleaned.order)) {
    errors.order = `order must be one of: ${SORT_ORDERS.join(', ')}`;
  }

  // Optional filters: only added to the result when provided.
  const filters = { status: STATUSES, category: CATEGORIES, priority: PRIORITIES };
  for (const [field, allowed] of Object.entries(filters)) {
    const value = query?.[field];
    if (value === undefined) {
      continue;
    }
    if (allowed.includes(value)) {
      cleaned[field] = value;
    } else {
      errors[field] = `${field} must be one of: ${allowed.join(', ')}`;
    }
  }

  if (search !== undefined) {
    if (typeof search !== 'string') {
      errors.search = 'Search must be a single string';
    } else if (search.trim().length > 0) {
      cleaned.search = search.trim();
    }
  }

  throwIfErrors(errors);

  return cleaned;
}
