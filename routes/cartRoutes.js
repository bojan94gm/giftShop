import { Router } from 'express'
import {
  getCart,
  createCart,
  deleteCart,
  updateCart,
} from '../controllers/cartController.js'

const router = Router()

router.get('/:id', getCart)
router.post('/', createCart)
router.patch('/:id', updateCart)
router.delete('/:id', deleteCart)

export default router
