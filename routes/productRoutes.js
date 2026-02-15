import {
  getAllProducts,
  getProduct,
  deleteProduct,
  updateProduct,
  createProduct,
} from '../controllers/productController.js'

import { uploadImages } from '../controllers/uploadController.js'

import { Router } from 'express'

const router = Router()

router.route('/').get(getAllProducts).post(createProduct)
router.route('/:id').get(getProduct).patch(updateProduct).delete(deleteProduct)
router.route('/uploads').post(uploadImages)

export default router
