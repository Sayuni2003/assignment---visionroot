import {
  validateCreateRequest,
  validateListQuery,
  validateStatusUpdate,
  validateUpdateRequest,
} from '../validators/request.validator.js';
// Imported as a namespace because the service functions share names with these handlers.
import * as requestService from '../services/request.service.js';

// Handlers only validate input, call the service and shape the response. Express 5 forwards
// rejected promises to the error handler, so there is no try/catch here.

export async function list(req, res) {
  const { requests, pagination } = await requestService.listRequests(
    req.user,
    validateListQuery(req.query),
  );

  res.json({ success: true, data: requests, pagination });
}

export async function getById(req, res) {
  const request = await requestService.getRequestById(req.user, req.params.id);

  res.json({ success: true, data: { request } });
}

export async function create(req, res) {
  const request = await requestService.createRequest(req.user, validateCreateRequest(req.body));

  res.status(201).json({ success: true, message: 'Request created', data: { request } });
}

export async function update(req, res) {
  const request = await requestService.updateRequest(
    req.user,
    req.params.id,
    validateUpdateRequest(req.body),
  );

  res.json({ success: true, message: 'Request updated', data: { request } });
}

export async function cancel(req, res) {
  const request = await requestService.cancelRequest(req.user, req.params.id);

  res.json({ success: true, message: 'Request cancelled', data: { request } });
}

export async function updateStatus(req, res) {
  const { status } = validateStatusUpdate(req.body);
  const request = await requestService.updateStatus(req.params.id, status);

  res.json({ success: true, message: 'Status updated', data: { request } });
}
