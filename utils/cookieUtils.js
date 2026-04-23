import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  getAuthCookieBaseOptions,
} from './tokenUtils.js'

const EXPIRED_COOKIE_DATE = new Date(0)
const EXPIRED_COOKIE_MAX_AGE_MS = 0

export const setCookie = (res, cookieName, token, duration) => {
  res.cookie(cookieName, token, {
    ...getAuthCookieBaseOptions(),
    maxAge: duration,
    signed: true,
  })
}

export const clearCookie = (res, cookieName) => {
  res.cookie(cookieName, '', {
    ...getAuthCookieBaseOptions(),
    expires: EXPIRED_COOKIE_DATE,
    maxAge: EXPIRED_COOKIE_MAX_AGE_MS,
  })
}

export const clearAuthCookies = (res) => {
  clearCookie(res, ACCESS_TOKEN_COOKIE_NAME)
  clearCookie(res, REFRESH_TOKEN_COOKIE_NAME)
}
