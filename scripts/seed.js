import * as dotenv from 'dotenv'
import { faker } from '@faker-js/faker'
import mongoose from 'mongoose'
import { pathToFileURL } from 'url'

import Cart from '../models/Cart.js'
import Category from '../models/Category.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Token from '../models/Token.js'
import User from '../models/User.js'
import { hashPassword } from '../utils/passwordUtils.js'

dotenv.config()

const DEFAULT_SEED_ENV = 'dev'
const FAKER_SEED = 42
const NORMAL_PRODUCT_COUNT = 12
const ORDER_QUANTITY = 1

const QA_USERS = [
  {
    email: 'admin@giftshop.test',
    name: 'QA Admin',
    password: 'AdminPass123!',
    role: 'admin',
  },
  {
    email: 'user1@giftshop.test',
    name: 'QA User One',
    password: 'UserPass123!',
    role: 'user',
  },
  {
    email: 'user2@giftshop.test',
    name: 'QA User Two',
    password: 'UserPass123!',
    role: 'user',
  },
]

const CATEGORY_NAMES = [
  'Electronics',
  'Home & Living',
  'Beauty',
  'Toys',
  'Books',
]

const EDGE_CASE_PRODUCTS = [
  { name: 'QA Out Of Stock Camera', price: 79.99, stock: 0, reservedQuantity: 0 },
  { name: 'QA Out Of Stock Doll', price: 19.99, stock: 0, reservedQuantity: 0 },
  { name: 'QA Last Item Lamp', price: 24.5, stock: 1, reservedQuantity: 0 },
  { name: 'QA Last Item Book', price: 11.25, stock: 1, reservedQuantity: 0 },
  {
    name: 'QA Fully Reserved Console',
    price: 149.99,
    stock: 3,
    reservedQuantity: 3,
  },
  {
    name: 'QA Fully Reserved Toy Car',
    price: 8.49,
    stock: 2,
    reservedQuantity: 2,
  },
  { name: 'QA Free Sticker', price: 0, stock: 50, reservedQuantity: 0 },
  { name: 'QA One Cent Bookmark', price: 0.01, stock: 50, reservedQuantity: 0 },
]

const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

const slugify = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
}

const parseArgs = (argv) => {
  return argv.reduce(
    (options, arg) => {
      if (arg.startsWith('--env=')) {
        return { ...options, env: arg.split('=')[1] }
      }

      if (arg === '--reset') {
        return { ...options, reset: true }
      }

      return options
    },
    { env: DEFAULT_SEED_ENV, reset: false },
  )
}

const resetCollections = async () => {
  await Promise.all([
    Cart.deleteMany({}),
    Category.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    Token.deleteMany({}),
    User.deleteMany({}),
  ])
}

const seedUsers = async () => {
  const seededUsers = []

  for (const user of QA_USERS) {
    const password = await hashPassword(user.password)
    const seededUser = await User.findOneAndUpdate(
      { email: user.email },
      {
        $set: {
          email: user.email,
          isVerified: true,
          name: user.name,
          password,
          role: user.role,
          verificationToken: '',
          verified: new Date(),
        },
      },
      { new: true, setDefaultsOnInsert: true, upsert: true },
    )

    seededUsers.push(seededUser)
  }

  return seededUsers
}

const seedCategories = async () => {
  const categories = []

  for (const name of CATEGORY_NAMES) {
    const category = await Category.findOneAndUpdate(
      { slug: slugify(name) },
      { $set: { isActive: true, name, slug: slugify(name) } },
      { new: true, setDefaultsOnInsert: true, upsert: true },
    )

    categories.push(category)
  }

  return categories
}

const buildProductPayload = (category, product, index) => ({
  category: category._id,
  description: faker.commerce.productDescription(),
  featured: index % 3 === 0,
  images: [`/uploads/seed-${slugify(product.name)}.webp`],
  isActive: true,
  name: product.name,
  price: product.price,
  reservedQuantity: product.reservedQuantity,
  sku: `QA-${String(index + 1).padStart(3, '0')}`,
  slug: slugify(product.name),
  stock: product.stock,
  tags: [category.slug, faker.commerce.productAdjective().toLowerCase()],
})

const seedProducts = async (categories, minimal = false) => {
  const normalProducts = Array.from({
    length: minimal ? 0 : NORMAL_PRODUCT_COUNT,
  }).map((_, index) => ({
    name: `QA ${faker.commerce.productName()} ${index + 1}`,
    price: Number(faker.commerce.price({ min: 5, max: 250, dec: 2 })),
    reservedQuantity: 0,
    stock: faker.number.int({ min: 5, max: 100 }),
  }))

  const sourceProducts = minimal
    ? EDGE_CASE_PRODUCTS.slice(0, 5)
    : [...EDGE_CASE_PRODUCTS, ...normalProducts]
  const products = []

  for (const [index, product] of sourceProducts.entries()) {
    const category = categories[index % categories.length]
    const payload = buildProductPayload(category, product, index)
    const seededProduct = await Product.findOneAndUpdate(
      { sku: payload.sku },
      { $set: payload },
      { new: true, setDefaultsOnInsert: true, upsert: true },
    )

    products.push(seededProduct)
  }

  return products
}

const seedCart = async (user, products) => {
  const cartProducts = products
    .filter((product) => product.stock - product.reservedQuantity > 1)
    .slice(0, 2)
    .map((product) => ({ product: product._id, quantity: 1 }))
  const total = cartProducts.reduce((sum, item) => {
    const product = products.find((entry) => entry._id.equals(item.product))
    return sum + product.price * item.quantity
  }, 0)

  return Cart.findOneAndUpdate(
    { userId: user._id },
    { $set: { products: cartProducts, status: 'active', total } },
    { new: true, setDefaultsOnInsert: true, upsert: true },
  )
}

const buildCustomer = (user, suffix) => ({
  adress: {
    name: `${suffix} Street`,
    number: String(faker.number.int({ min: 1, max: 99 })),
  },
  city: 'Belgrade',
  country: 'Serbia',
  email: user.email,
  lastName: suffix,
  mobile: '+381601234567',
  name: user.name,
  postNumber: '11000',
  remark: `Seed order ${suffix}`,
})

const seedOrders = async (users, products) => {
  const userOne = users.find((user) => user.email === 'user1@giftshop.test')
  const userTwo = users.find((user) => user.email === 'user2@giftshop.test')
  const orderProducts = products
    .filter((product) => product.stock - product.reservedQuantity > 0)
    .slice(0, ORDER_STATUSES.length)

  for (const [index, status] of ORDER_STATUSES.entries()) {
    const product = orderProducts[index]
    const user = index % 2 === 0 ? userOne : userTwo
    const total = product.price * ORDER_QUANTITY
    const paymentStatus = status === 'delivered' ? 'paid' : 'unpaid'

    await Order.findOneAndUpdate(
      {
        status,
        userId: user._id,
      },
      {
        $set: {
          customer: buildCustomer(user, status),
          paymentMethod: index % 2 === 0 ? 'cash' : 'card',
          paymentStatus,
          products: [
            {
              name: product.name,
              price: product.price,
              productId: product._id,
              quantity: ORDER_QUANTITY,
            },
          ],
          status,
          total,
          userId: user._id,
        },
      },
      { new: true, setDefaultsOnInsert: true, upsert: true },
    )
  }
}

export const seedDatabase = async ({
  env = DEFAULT_SEED_ENV,
  minimal = false,
  reset = false,
} = {}) => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required')
  }

  faker.seed(FAKER_SEED)

  await mongoose.connect(process.env.MONGO_URI)

  if (reset) {
    await resetCollections()
  }

  const users = await seedUsers()
  const categories = await seedCategories()
  const products = await seedProducts(categories, minimal)
  const userOne = users.find((user) => user.email === 'user1@giftshop.test')

  await seedCart(userOne, products)

  if (!minimal) {
    await seedOrders(users, products)
  }

  return {
    categories: categories.length,
    env,
    products: products.length,
    users: users.length,
  }
}

const run = async () => {
  const options = parseArgs(process.argv.slice(2))
  const result = await seedDatabase(options)
  console.info(`Seed completed for ${result.env}`, result)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  run()
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
    .finally(async () => {
      await mongoose.disconnect()
    })
}
