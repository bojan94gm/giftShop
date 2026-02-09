import { StatusCodes } from 'http-status-codes'
import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import { BadRequestError, NotFoundError } from '../errors/errors.js'
import { validateAndCalculateCartData } from '../utils/cartUtils.js'
import mongoose from 'mongoose'

export const upsertCart = async (req, res) => {
  const session = await mongoose.startSession()
  const userId = req.user.userId

  try {
    await session.startTransaction()

    const existingCart = await Cart.findOne({
      userId: req.user.userId,
    }).session(session)

    if (existingCart) {
      const rollBackOps = existingCart.products.map((item) => ({
        updateOne: {
          filter: {
            _id: item.product,
          },
          update: {
            $inc: { reservedQuantity: -Number(item.quantity) },
          },
        },
      }))
      const result = await Product.bulkWrite(rollBackOps, { session })
      if (result.modifiedCount !== existingCart.products.length)
        throw new BadRequestError('Creating cart failed')
    }

    const cart = await validateAndCalculateCartData(req.body)

    const reserveOps = cart.products.map((item) => ({
      updateOne: {
        filter: {
          _id: item.product,
          $expr: {
            $gte: [
              '$stock',
              { $add: ['$reservedQuantity', Number(item.quantity)] },
            ],
          },
        },
        update: {
          $inc: { reservedQuantity: Number(item.quantity) },
        },
      },
    }))

    const reserveResult = await Product.bulkWrite(reserveOps, { session })

    if (reserveResult.modifiedCount !== cart.products.length) {
      throw new BadRequestError('Some products are out of stock')
    }

    const validCart = await Cart.findOneAndUpdate(
      { userId },
      { products: cart.products, total: cart.total },
      { new: true, upsert: true, session },
    )

    await session.commitTransaction()
    res.status(StatusCodes.CREATED).json({ validCart })
  } catch (error) {
    console.log(error)
    if (session.inTransaction()) {
      await session.abortTransaction()
    }
    throw error
  } finally {
    await session.endSession()
  }
}

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    })

    if (!cart) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: 'Cart is not found' })
    }

    res.status(StatusCodes.OK).json({ cart })
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const deleteCart = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    await session.startTransaction()

    const cart = await Cart.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    })

    if (!cart) {
      throw new NotFoundError('Cart does not exist')
    }

    const rollBackOps = cart.products.map((item) => ({
      updateOne: {
        filter: {
          _id: item.product,
        },
        update: {
          $inc: { reservedQuantity: -Number(item.quantity) },
        },
      },
    }))

    const result = await Product.bulkWrite(rollBackOps, { session })

    if (result.modifiedCount !== cart.products.length) {
      throw new BadRequestError('Removing cart failed')
    }
    await session.commitTransaction()
    res.status(StatusCodes.OK).json({ msg: 'Deleted cart' })
  } catch (error) {
    console.log(error)
    await session.abortTransaction()
    throw error
  } finally {
    await session.endSession()
  }
}

export const clearCart = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    await session.startTransaction()

    const clearedCart = await Cart.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: { products: [], total: 0 } },
      { session },
    )

    if (!clearedCart) {
      throw new NotFoundError('Cart is not found')
    }

    const rollBackOps = clearedCart.products.map((item) => ({
      updateOne: {
        filter: {
          _id: item.product,
        },
        update: {
          $inc: { reservedQuantity: -Number(item.quantity) },
        },
      },
    }))

    const result = await Product.bulkWrite(rollBackOps, { session })

    if (result.modifiedCount !== clearedCart.products.length) {
      throw new BadRequestError('Emptying cart failed')
    }

    await session.commitTransaction()
    res.status(StatusCodes.OK).json({
      msg: 'Cart is cleared',
    })
  } catch (error) {
    console.log(error)
    await session.abortTransaction()
    throw error
  } finally {
    await session.endSession()
  }
}
