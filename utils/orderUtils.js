import Cart from '../models/Cart.js'

export const getOrderInfo = async (userId, paymentMethod, customer) => {
  const productsFromCart = await Cart.findOne({
    userId: userId,
  }).populate('products.product')

  const products = productsFromCart.products.map((item) => {
    return {
      productId: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
    }
  })

  const total = products.reduce((acc, item) => {
    return acc + item.quantity * item.price
  }, 0)

  return {
    products,
    total,
    paymentMethod,
    customer,
  }
}
