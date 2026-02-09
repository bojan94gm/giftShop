import { StatusCodes } from 'http-status-codes'
import Cart from '../models/Cart.js'
import { NotFoundError } from '../errors/errors.js'
import { validateAndCalculateCartData } from '../utils/cartUtils.js'

export const upsertCart = async (req, res) => {
  const userId = req.user.userId
  try {
    const cart = await validateAndCalculateCartData(req.body)
    const validCart = await Cart.findOneAndUpdate(
      { userId },
      { products: cart.products, total: cart.total },
      { new: true, upsert: true },
    )
    res.status(StatusCodes.CREATED).json({ validCart })
  } catch (error) {
    console.log(error)
    throw error
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
  try {
    const cart = await Cart.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId,
    })

    if (!cart) {
      throw new NotFoundError('Cart does not exist')
    }

    res.status(StatusCodes.OK).json({ msg: 'Deleted cart' })
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const clearCart = async (req, res) => {
  try {
    const clearedCart = await Cart.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: { products: [], total: 0 } },
    )
    if (!clearedCart) {
      throw new NotFoundError('Cart is not found')
    }
    res.status(StatusCodes.OK).json({
      msg: 'Cart is cleared',
    })
  } catch (error) {
    console.log(error)
    throw error
  }
}
