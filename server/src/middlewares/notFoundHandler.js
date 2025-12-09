import { NotFoundError } from '../utils/errors.js';

/**
 * Handle 404 - Route not found
 */
export const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
};

export default notFoundHandler;
