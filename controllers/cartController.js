import { StatusCodes } from 'http-status-codes'
import Cart from '../models/Cart.js'
import { BadRequestError, NotFoundError } from '../errors/errors.js'
import { calculateTotalCartPrice } from '../utils/cartTotal.js'
import mongoose from 'mongoose'

export const createCart = async (req, res) => {
  const cart = await Cart.create({
    userId: req.user.userId,
    products: req.body.products,
  })

  if (!cart) {
    throw new BadRequestError('Cart is not created')
  }

  const total = await calculateTotalCartPrice(cart)
  cart.total = total
  await cart.save()

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
    await calculateTotalCartPrice(cart)
    res.status(StatusCodes.OK).json({ cart })
  } catch (error) {
    console.log(error)
  }
}

export const updateCart = async (req, res) => {
  const quantity = Number(req.body.quantity)
  if (!Number.isInteger(quantity)) {
    throw new BadRequestError('Quantity is not integer')
  }

  try {
    const cart = await Cart.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
        'products.product': req.body.product,
      },
      { $inc: { 'products.$.quantity': quantity } },
      { new: true },
    )

    if (!cart) {
      throw new NotFoundError('Cart or product not found')
    }

    await calculateTotalCartPrice(cart)

    res.status(StatusCodes.OK).json({ msg: 'Updated cart', cart })
  } catch (error) {
    throw error
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

export const addProductToCart = async (req, res) => {
  const { product, quantity } = req.body

  if (!req.params.id) throw new BadRequestError('Cart ID is required')
  if (!product) throw new BadRequestError('Product id is required')

  console.log(typeof product, typeof quantity)

  const numQuantity = parseInt(quantity)

  if (numQuantity < 1 || !Number(numQuantity))
    throw new BadRequestError('Quantity must be integer larger than 0')

  try {
    const productId = new mongoose.Types.ObjectId(product)
    const updatedCart = await Cart.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
        'products.product': productId,
      },
      {
        $inc: { 'products.$.quantity': numQuantity },
      },
      { new: true },
    )

    if (updatedCart) {
      await calculateTotalCartPrice(updatedCart)
      return res
        .status(StatusCodes.OK)
        .json({ msg: 'Product added to cart', updatedCart })
    }

    const pushedCart = await Cart.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
      },
      {
        $push: { products: { product: productId, quantity: numQuantity } },
      },
      { new: true },
    )

    if (!pushedCart) {
      throw new NotFoundError('Cart is not found')
    }

    await calculateTotalCartPrice(pushedCart)

    res
      .status(StatusCodes.OK)
      .json({ msg: 'Product added to cart', pushedCart })
  } catch (error) {
    console.log(error)
    throw new BadRequestError('Product is not added to cart')
  }
}

export const deleteProductFromCart = async (req, res) => {
  console.log('bla bla')

  const productId = new mongoose.Types.ObjectId(req.body.product)
  const quantity = parseInt(req.body.quantity)

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new BadRequestError('quantity must be integer number greater than 0')
  }

  try {
    const updatedCart = await Cart.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.userId,
        'products.product': productId,
      },
      { $inc: { 'products.$.quantity': -quantity } },
      { new: true },
    )

    if (!updatedCart) {
      throw new NotFoundError('Cart is not found')
    }

    const product = updatedCart.products.find(
      (el) => el.product.toString() === productId.toString(),
    )

    if (product && product.quantity <= 0) {
      const productRemovedFromCart = await Cart.findOneAndUpdate(
        { _id: req.params.id, userId: req.user.userId },
        { $pull: { products: { product: productId } } },
        { new: true },
      )

      await calculateTotalCartPrice(productRemovedFromCart)

      return res.status(StatusCodes.OK).json({
        msg: 'Product removed from cart',
        cart: productRemovedFromCart,
      })
    }

    await calculateTotalCartPrice(updatedCart)

    return res.status(StatusCodes.OK).json({
      msg: 'Product quantity decremented from cart',
      cart: updatedCart,
    })
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const clearCart = async (req, res) => {
  try {
    const clearedCart = await Cart.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: { products: [] } },
      { new: true },
    )

    if (!clearedCart) {
      throw new NotFoundError('Cart is not found')
    }

    await calculateTotalCartPrice(clearedCart)

    return res.status(StatusCodes.OK).json({
      msg: 'Cart is cleared',
      cart: clearedCart,
    })
  } catch (error) {
    console.log(error)
    throw error
  }
}
