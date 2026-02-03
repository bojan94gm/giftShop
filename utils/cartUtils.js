import { BadRequestError } from '../errors/errors.js'
import Cart from '../models/Cart.js'
import Product from '../models/Product.js'

export const validateAndCalculateCartData = async (cart) => {
  const ids = cart.products.map((item) => item.product)

  const products = await Product.find({ _id: { $in: ids } }).select(
    'name stock price',
  )

  if (products.length !== cart.products.length) {
    throw new BadRequestError('Cart is not valid')
  }

  let total = 0

  const productsMap = new Map()

  products.forEach((product) => {
    productsMap.set(product._id.toString(), product)
  })

  for (const cartItem of cart.products) {
    const product = productsMap.get(cartItem.product)

    const requestedQuantity = Number(cartItem.quantity)

    if (isNaN(requestedQuantity) || requestedQuantity <= 0) {
      throw new BadRequestError(
        'Quantity is not valid value. Must be integer greater than 0',
      )
    }

    if (requestedQuantity > product.stock) {
      throw new BadRequestError(
        `Quantity of ${requestedQuantity} items of ${product.name} product is not available, current stock is: ${product.stock}`,
      )
    }

    total += product.price * requestedQuantity
  }

  cart.total = total
  return cart
}

export const recalculateTotalCartPrice = async (cart) => {
  const populatedCart = await Cart.findById(cart._id).populate(
    'products.product',
  )

  const total = populatedCart.products.reduce((acc, item) => {
    return acc + item.product.price * item.quantity
  }, 0)

  cart.total = total

  try {
    await cart.save()
  } catch (error) {
    console.log(error)
    throw new BadRequestError('Failed to update products in cart')
  }

  return cart
}
