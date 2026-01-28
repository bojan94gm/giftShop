import { BadRequestError, NotFoundError } from '../errors/errors.js'
import Cart from '../models/Cart.js'

export const calculateTotalCartPrice = async (cart) => {
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
}
