export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function assert(condition, status, message) {
  if (!condition) throw new HttpError(status, message);
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function pagination(query, defaults = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(query.pageSize, 10) || defaults.pageSize || 20, 1), 100);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
