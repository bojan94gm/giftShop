import { Router } from 'express'
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrder,
  resetOrderStatus,
  updateOrder,
} from '../controllers/orderController.js'

const router = Router()

router.route('/').post(createOrder)
router.route('/').get(getAllOrders)
router.route('/user-orders/:id').get(getMyOrders)
router.route('/:id').get(getOrder)
router.route('/:id').patch(updateOrder)
router.route('/reset-status/:id').patch(resetOrderStatus)

export default router
