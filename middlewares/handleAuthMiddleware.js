import { UnauthenticatedError } from '../errors/errors.js'
import { validateUser } from '../utils/tokenUtils.js'

export const authenticationMiddleware = (req, res, next) => {
  const token = req.signedCookies.accessToken

  if (!token) throw new UnauthenticatedError('Authentication required')

  const user = validateUser(token)

  if (!user) throw new UnauthenticatedError('Authentication required')

  req.user = {
    userId: user.userId,
    role: user.role,
  }
  next()
}

export const attachUserIfPresent = (req, res, next) => {
  const token = req.signedCookies?.accessToken

  if (!token) return next()

  try {
    const user = validateUser(token)

    req.user = {
      userId: user.userId,
      role: user.role,
    }
  } catch (error) {
    req.user = undefined
  }

  next()
}
