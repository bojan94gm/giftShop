import { Router } from 'express'
import {
  login,
  logout,
  refresh,
  register,
  verifyEmail,
} from '../controllers/authController.js'
import {
  validateRegistration,
  validateLogin,
} from '../middlewares/handleValidationMiddleware.js'

const router = Router()

router.post('/login', validateLogin, login)
router.post('/register', validateRegistration, register)
router.post('/refresh', refresh)
router.get('/logout', logout)
router.post('/verify-email', verifyEmail)

export default router
