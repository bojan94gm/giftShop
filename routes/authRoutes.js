import { Router } from 'express'
import { login, logout, register } from '../controllers/authController.js'
import {
  validateRegistration,
  validateLogin,
} from '../middlewares/handleValidationMiddleware.js'
import { authenticationMiddleware } from '../middlewares/handleAuthMiddleware.js'

const router = Router()

router.post('/login', validateLogin, login, authenticationMiddleware)
router.post('/register', validateRegistration, register)
router.get('/logout', logout)

export default router
