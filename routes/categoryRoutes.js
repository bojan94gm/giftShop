import { Router } from 'express'

import {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js'

import { validateCategory } from '../middlewares/handleValidationMiddleware.js'
import { authorizationMiddleware } from '../middlewares/authorizationMiddleware.js'
import {
  attachUserIfPresent,
  authenticationMiddleware,
} from '../middlewares/handleAuthMiddleware.js'
import { publicCatalogRateLimit } from '../middlewares/rateLimitMiddleware.js'

const router = Router()

router
  .route('/')
  .get(publicCatalogRateLimit, attachUserIfPresent, getAllCategories)
  .post(
    authenticationMiddleware,
    authorizationMiddleware,
    validateCategory,
    createCategory,
  )
router
  .route('/:id')
  .get(publicCatalogRateLimit, attachUserIfPresent, getCategory)
  .patch(
    authenticationMiddleware,
    authorizationMiddleware,
    validateCategory,
    updateCategory,
  )
  .put(
    authenticationMiddleware,
    authorizationMiddleware,
    validateCategory,
    updateCategory,
  )
  .delete(authenticationMiddleware, authorizationMiddleware, deleteCategory)

export default router
