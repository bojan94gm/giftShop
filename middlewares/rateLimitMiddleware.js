import rateLimit from 'express-rate-limit'
import { StatusCodes } from 'http-status-codes'

export const PUBLIC_CATALOG_RATE_LIMIT_WINDOW_MS = 60 * 1000
export const PUBLIC_CATALOG_RATE_LIMIT_MAX_REQUESTS = 100

export const publicCatalogRateLimit = rateLimit({
  legacyHeaders: false,
  limit: PUBLIC_CATALOG_RATE_LIMIT_MAX_REQUESTS,
  message: { msg: 'Too many catalog requests, please try again later' },
  standardHeaders: true,
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  windowMs: PUBLIC_CATALOG_RATE_LIMIT_WINDOW_MS,
})
