import ServiceRequest from '../models/serviceRequest.model.js';
import AppError from '../utils/AppError.js';
import { canTransition } from '../constants/request.constants.js';

// `user` is req.user ({ id, name, email, role }) as set by the authenticate middleware.

// A USER asking for someone else's request gets the same 404 as for a missing one, so the
// response never reveals that the request exists.
async function findAccessibleRequest(user, id) {
  const request = await ServiceRequest.findById(id);

  if (!request || (user.role === 'USER' && !request.createdBy.equals(user.id))) {
    throw new AppError(404, 'Request not found');
  }

  return request;
}

// Search text is matched literally: characters like "." or "(" must not act as regex syntax.
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listRequests(user, query) {
  const { page, limit, sortBy, order, status, category, priority, search } = query;
  const filter = {};

  if (user.role === 'USER') {
    filter.createdBy = user.id;
  }
  if (status) {
    filter.status = status;
  }
  if (category) {
    filter.category = category;
  }
  if (priority) {
    filter.priority = priority;
  }
  if (search) {
    const regex = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const [requests, total] = await Promise.all([
    ServiceRequest.find(filter)
      .sort({ [sortBy]: order === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'name email'),
    ServiceRequest.countDocuments(filter),
  ]);

  return {
    requests,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getRequestById(user, id) {
  const request = await findAccessibleRequest(user, id);
  return request.populate('createdBy', 'name email');
}

export function createRequest(user, data) {
  // The owner always comes from the authenticated user, never from the request body.
  return ServiceRequest.create({ ...data, createdBy: user.id });
}

export async function updateRequest(user, id, data) {
  const request = await findAccessibleRequest(user, id);

  if (request.status !== 'PENDING') {
    throw new AppError(409, 'Only pending requests can be edited');
  }

  Object.assign(request, data);
  return request.save();
}

// Cancelling is a status change, never a delete, so the request stays in the history.
export async function cancelRequest(user, id) {
  const request = await findAccessibleRequest(user, id);

  if (!canTransition(request.status, 'CANCELLED')) {
    throw new AppError(409, `Cannot change status from ${request.status} to CANCELLED`);
  }

  request.status = 'CANCELLED';
  return request.save();
}

// Admin only: the route restricts this to ADMIN, so there is no ownership check here.
export async function updateStatus(id, newStatus) {
  const request = await ServiceRequest.findById(id);

  if (!request) {
    throw new AppError(404, 'Request not found');
  }

  if (!canTransition(request.status, newStatus)) {
    throw new AppError(409, `Cannot change status from ${request.status} to ${newStatus}`);
  }

  request.status = newStatus;
  return request.save();
}
