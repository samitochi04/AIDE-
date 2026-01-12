// ===========================================
// Custom Error Classes
// ===========================================

export class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMITED');
  }
}

export class PaymentError extends AppError {
  constructor(message = 'Payment required') {
    super(message, 402, 'PAYMENT_ERROR');
  }
}

export class AIError extends AppError {
  constructor(message = 'AI service unavailable') {
    super(message, 503, 'AI_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service, message) {
    super(`${service} error: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}
