import { UnauthorizedError } from '../errors/errors.js'

export const authorizationMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    throw new UnauthorizedError('Admin access only')
  }

  next()
}
