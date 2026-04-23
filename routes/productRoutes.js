import {
  getAllProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  createProduct,
} from '../controllers/productController.js'
import { uploadImages } from '../controllers/uploadController.js'

import { Router } from 'express'
import { authorizationMiddleware } from '../middlewares/authorizationMiddleware.js'
import {
  attachUserIfPresent,
  authenticationMiddleware,
} from '../middlewares/handleAuthMiddleware.js'
import { publicCatalogRateLimit } from '../middlewares/rateLimitMiddleware.js'

const router = Router()

router
  .route('/')
  .get(publicCatalogRateLimit, attachUserIfPresent, getAllProducts)
  .post(authenticationMiddleware, authorizationMiddleware, createProduct)
router
  .route('/:id')
  .get(publicCatalogRateLimit, attachUserIfPresent, getProduct)
  .patch(authenticationMiddleware, authorizationMiddleware, updateProduct)
  .put(authenticationMiddleware, authorizationMiddleware, updateProduct)
  .delete(authenticationMiddleware, authorizationMiddleware, deleteProduct)
router
  .route('/uploads')
  .post(authenticationMiddleware, authorizationMiddleware, uploadImages)

export default router
