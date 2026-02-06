import { Router } from 'express'
import {
  getCart,
  deleteCart,
  clearCart,
  upsertCart,
} from '../controllers/cartController.js'

const router = Router()

router.get('/:id', getCart)
router.delete('/:id', deleteCart)
router.patch('/clear/:id', clearCart)
router.put('/', upsertCart)

export default router
