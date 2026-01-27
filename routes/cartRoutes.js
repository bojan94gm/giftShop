import { Router } from 'express'
import {
  getCart,
  createCart,
  deleteCart,
  updateCart,
  addProductToCart,
  deleteProductFromCart,
} from '../controllers/cartController.js'

const router = Router()

router.get('/:id', getCart)
router.post('/', createCart)
router.patch('/:id', updateCart)
router.delete('/:id', deleteCart)
router.patch('/add/:id', addProductToCart)
router.patch('/remove/:id', deleteProductFromCart)

export default router
