import { StatusCodes } from 'http-status-codes'
import { BadRequestError, UnauthenticatedError } from '../errors/errors.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import {
  getOrderInfo,
  increaseStockQuantity,
  reserveQuantityOps,
} from '../utils/orderUtils.js'
import {
  decreaseStockQuantity,
  reservedQuantityRollBack,
} from '../utils/orderUtils.js'
import mongoose from 'mongoose'
import Cart from '../models/Cart.js'

export const createOrder = async (req, res) => {
  const { customer, paymentMethod } = req.body

  if (!customer || !paymentMethod) {
    throw new BadRequestError('Custom info and payment method required')
  }

  try {
    const orderInfo = await getOrderInfo(
      req.user.userId,
      paymentMethod,
      customer,
    )
    const order = await Order.create(orderInfo)
    if (!order) throw new Error('Order is not created')

    const clearedCart = await Cart.findOneAndUpdate(
      {
        userId: req.user.userId,
      },
      {
        $set: {
          products: [],
          total: 0,
        },
      },
    )

    if (!clearedCart) throw new Error('Clearing cart after order failed')

    res.status(StatusCodes.CREATED).json({ msg: 'Order created' })
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    res.status(StatusCodes.CREATED).json({ order })
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const updateOrder = async (req, res) => {
  if (!req.body.status) throw new BadRequestError('Invalid order status')

  const session = await mongoose.startSession()
  try {
    await session.startTransaction()

    if (req.body.status === 'confirmed') {
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: req.params.id, status: 'pending' },

        { $set: { status: 'confirmed', paymentStatus: 'unpaid' } },
        { new: true, runValidators: true, session },
      )

      if (!updatedOrder) {
        throw new BadRequestError('Order status must be pending')
      }

      const reserveOps = reserveQuantityOps(updatedOrder.products)

      const result = await Product.bulkWrite(reserveOps, { session })
      if (result.matchedCount === 0)
        throw new Error('Adding quantity to reserved quantity failed')
      await session.commitTransaction()

      return res
        .status(StatusCodes.OK)
        .json({ msg: 'Order confirmed', updatedOrder })
    }

    if (req.body.status === 'shipped') {
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: req.params.id, status: 'confirmed' },
        { $set: { status: 'shipped', paymentStatus: 'unpaid' } },
        { new: true, runValidators: true, session },
      )
      if (!updatedOrder) {
        throw new BadRequestError('Order status must be first confirmed')
      }

      await session.commitTransaction()

      return res
        .status(StatusCodes.OK)
        .json({ msg: 'Order is shipped', updatedOrder })
    }

    if (req.body.status === 'delivered') {
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: req.params.id, status: 'shipped' },

        { $set: { status: 'delivered', paymentStatus: 'paid' } },
        { new: true, runValidators: true, session },
      )

      if (!updatedOrder) {
        throw new BadRequestError('Order status must be first shipped')
      }

      const stockOps = decreaseStockQuantity(updatedOrder.products)

      const result = await Product.bulkWrite(stockOps, { session })
      if (result.matchedCount === 0)
        throw new Error('Rolling back products stock failed')
      await session.commitTransaction()
      return res.status(StatusCodes.OK).json({ updatedOrder })
    }

    if (req.body.status === 'cancelled') {
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: req.params.id,
          status: { $in: ['confirmed', 'shipped'] },
        },

        { $set: { status: 'cancelled', paymentStatus: 'unpaid' } },
        { new: true, runValidators: true, session },
      )

      if (!updatedOrder) {
        throw new BadRequestError(
          'To cancel order, status must be confirmed or shipped',
        )
      }

      const rollBackOps = reservedQuantityRollBack(updatedOrder.products)

      const result = await Product.bulkWrite(rollBackOps, { session })
      if (result.matchedCount === 0)
        throw new Error('Rolling back products stock failed')
      await session.commitTransaction()
      return res.status(StatusCodes.OK).json({ updatedOrder })
    }

    throw new BadRequestError('Unsupported order status')
  } catch (error) {
    console.log(error)
    await session.abortTransaction()
    throw error
  } finally {
    await session.endSession()
  }
}

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
    if (!orders) {
      throw new BadRequestError('Orders not found')
    }

    res.status(StatusCodes.OK).json({ orders })
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId })
    if (!orders) throw new BadRequestError('Orders not found')
    res.status(StatusCodes.OK).json({ orders })
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const resetOrderStatus = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    await session.startTransaction()

    const order = await Order.findByIdAndUpdate(
      { _id: req.params.id },
      {
        $set: { status: 'pending', paymentStatus: 'unpaid' },
      },
      { session },
    )

    if (!order) throw new BadRequestError('Order not found')

    if (['confirmed', 'shipped'].includes(order.status)) {
      const rollBackOps = await reservedQuantityRollBack(order.products)

      const result = await Product.bulkWrite(rollBackOps, { session })

      if (result.matchedCount !== order.products.length)
        throw new Error('Reset reserved quantity failed')
    }

    if (order.status === 'delivered') {
      const increaseStockOps = await increaseStockQuantity(order.products)

      const result = await Product.bulkWrite(increaseStockOps, { session })

      if (result.matchedCount !== order.products.length)
        throw new Error('Increase stock quantity failed')
    }

    await session.commitTransaction()
    res.status(StatusCodes.OK).json({ order })
  } catch (error) {
    console.log(error)
    await session.abortTransaction()
    throw new Error('Reset order failed')
  } finally {
    await session.endSession()
  }
}
