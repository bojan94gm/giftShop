import { body, validationResult } from 'express-validator'
import { BadRequestError } from '../errors/errors.js'
const withValidationErrors = (validationValues) => {
  return [
    validationValues,
    (req, res, next) => {
      const errors = validationResult(req)

      const errorMessages = errors.array().map((error) => error.msg)

      if (errorMessages.length > 0) {
        throw new BadRequestError(errorMessages)
      }

      next()
    },
  ]
}

export const validateRegistration = withValidationErrors([
  body('name')
    .notEmpty()
    .withMessage('username is required')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters long'),
  body('email')
    .notEmpty()
    .withMessage('email is required')
    .isEmail()
    .withMessage('invalid email type')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('password is required')
    .isLength({ min: 8 })
    .withMessage('password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*]/)
    .withMessage('Password must contain at least one special character'),
])

export const validateLogin = withValidationErrors([
  body('email')
    .notEmpty()
    .withMessage('email is required')
    .isEmail()
    .withMessage('invalid email type')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('password is required')
    .isLength({ min: 8 }),
])

export const validateCategory = withValidationErrors([
  body('name')
    .notEmpty()
    .withMessage('name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('category name must be between 2 and 50 characters long'),
])
