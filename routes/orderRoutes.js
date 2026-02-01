import { Router } from 'express'
import { createOrder, getOrder } from '../controllers/orderController.js'

const router = Router()

router.route('/').post(createOrder)
router.route('/:id').get(getOrder)

export default router
