import { Router } from 'express'
import {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrder,
  resetOrderStatus,
  updateOrder,
} from '../controllers/orderController.js'
import { authorizationMiddleware } from '../middlewares/authorizationMiddleware.js'

const router = Router()

router.route('/').post(createOrder)
router.route('/').get(authorizationMiddleware, getAllOrders)
router.route('/user-orders/:id').get(getMyOrders)
router
  .route('/:id')
  .get(getOrder)
  .put(authorizationMiddleware, updateOrder)
  .patch(authorizationMiddleware, updateOrder)
router.route('/:id/reset').patch(authorizationMiddleware, resetOrderStatus)
router
  .route('/reset-status/:id')
  .patch(authorizationMiddleware, resetOrderStatus)

export default router
