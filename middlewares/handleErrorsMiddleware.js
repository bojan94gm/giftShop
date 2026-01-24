import { StatusCodes } from 'http-status-codes'

export const handleErrorsMiddleware = (err, req, res, next) => {
  console.log(err.message)
  const msg = err.message || 'Something went wrong, please try again'
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
  res.status(statusCode).json({ ErrorMessage: msg })
}
