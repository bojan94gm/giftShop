import { StatusCodes } from 'http-status-codes'
import Cart from '../models/Cart.js'
import { BadRequestError, NotFoundError } from '../errors/errors.js'

export const createCart = async (req, res) => {
  const cart = await Cart.create({
    userId: req.user.userId,
    products: req.body.products,
  })

  if (!cart) {
    throw new BadRequestError('Cart is not created')
  }

  res.status(StatusCodes.CREATED).json({ msg: 'Created cart', cart })
}

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    })

    if (!cart) {
      throw new BadRequestError('Cart is not found')
    }

    res.status(StatusCodes.OK).json({ cart })
  } catch (error) {
    console.log(error)
  }
}

export const updateCart = async (req, res) => {
  const quantity = Number(req.body.quantity)
  if (!Number.isInteger(quantity)) {
    throw new BadRequestError('quantity is not integer')
  }

  try {
    const cart = await Cart.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
        'products.product': req.body.product,
      },
      { $inc: { 'products.$.quantity': quantity } },
    )

    if (!cart) {
      throw new NotFoundError('Cart or product not found')
    }

    res.status(StatusCodes.OK).json({ msg: 'Updated cart', cart })
  } catch (error) {
    throw new BadRequestError('Cart is not updated')
  }
}

export const deleteCart = async (req, res) => {
  const cart = await Cart.findOneAndDelete({
    _id: req.params.id,
    userId: req.user.userId,
  })

  if (!cart) {
    throw new NotFoundError('Cart does not exist')
  }

  res.status(StatusCodes.OK).json({ msg: 'Deleted cart' })
}
