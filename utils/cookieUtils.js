import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from './tokenUtils.js'

const EXPIRED_COOKIE_MAX_AGE_MS = 0

export const setCookie = (res, cookieName, token, duration) => {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: duration,
  })
}

export const clearCookie = (res, cookieName) => {
  res.cookie(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    signed: true,
    sameSite: 'lax',
    maxAge: EXPIRED_COOKIE_MAX_AGE_MS,
  })
}

export const clearAuthCookies = (res) => {
  clearCookie(res, ACCESS_TOKEN_COOKIE_NAME)
  clearCookie(res, REFRESH_TOKEN_COOKIE_NAME)
}
