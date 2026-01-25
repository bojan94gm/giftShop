import { Router } from 'express'

import {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js'

import { validateCategory } from '../middlewares/handleValidationMiddleware.js'

const router = Router()

router.route('/').post(validateCategory, createCategory).get(getAllCategories)
router
  .route('/:id')
  .get(getCategory)
  .patch(validateCategory, updateCategory)
  .delete(deleteCategory)

export default router
