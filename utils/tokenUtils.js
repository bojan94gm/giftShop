import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const MILLISECONDS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24
const REFRESH_TOKEN_TTL_DAYS = 7
const REFRESH_TOKEN_BYTES = 40
const DEFAULT_ACCESS_TOKEN_JWT_TTL = '1h'
const DEFAULT_REFRESH_TOKEN_JWT_TTL = `${REFRESH_TOKEN_TTL_DAYS}d`

export const ACCESS_TOKEN_COOKIE_NAME = 'accessToken'
export const REFRESH_TOKEN_COOKIE_NAME = 'refreshToken'

export const ACCESS_TOKEN_COOKIE_MAX_AGE_MS =
  MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND

export const REFRESH_TOKEN_COOKIE_MAX_AGE_MS =
  REFRESH_TOKEN_TTL_DAYS *
  HOURS_PER_DAY *
  MINUTES_PER_HOUR *
  SECONDS_PER_MINUTE *
  MILLISECONDS_PER_SECOND

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required')
  }

  return process.env.JWT_SECRET
}

export const createJWT = (payload, options = {}) => {
  const token = jwt.sign(payload, getJwtSecret(), options)
  return token
}

export const createAccessToken = (user) => {
  return createJWT(
    {
      name: user.name,
      userId: user._id,
      role: user.role,
    },
    { expiresIn: process.env.JWT_LIFETIME || DEFAULT_ACCESS_TOKEN_JWT_TTL },
  )
}

export const createRefreshToken = () => {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex')
}

export const createRefreshTokenJWT = ({ user, refreshToken }) => {
  return createJWT(
    {
      name: user.name,
      userId: user._id,
      role: user.role,
      refreshToken,
    },
    { expiresIn: DEFAULT_REFRESH_TOKEN_JWT_TTL },
  )
}

export const getRefreshTokenExpiresAt = () => {
  return new Date(Date.now() + REFRESH_TOKEN_COOKIE_MAX_AGE_MS)
}

export const validateUser = (token) => {
  const user = jwt.verify(token, getJwtSecret())
  return user
}

export const attachCookiesToResponse = ({
  res,
  user,
  accessToken,
  refreshToken,
}) => {
  const refreshTokenJWT = createRefreshTokenJWT({ user, refreshToken })

  res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    sameSite: 'lax',
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE_MS,
  })

  res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshTokenJWT, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  })
}
