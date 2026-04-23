import assert from 'node:assert/strict'
import test, { afterEach, mock } from 'node:test'
import mongoose from 'mongoose'

import {
  createProduct,
  getAllProducts,
  getProduct,
} from '../../controllers/productController.js'
import { authorizationMiddleware } from '../../middlewares/authorizationMiddleware.js'
import { authenticationMiddleware } from '../../middlewares/handleAuthMiddleware.js'
import { publicCatalogRateLimit } from '../../middlewares/rateLimitMiddleware.js'
import Product from '../../models/Product.js'
import productRouter from '../../routes/productRoutes.js'

const createResponse = () => {
  const response = {
    body: undefined,
    statusCode: undefined,
    json(payload) {
      this.body = payload
      return this
    },
    status(statusCode) {
      this.statusCode = statusCode
      return this
    },
  }

  return response
}

const getRouteMethodStack = (path, method) => {
  const layer = productRouter.stack.find((item) => {
    return item.route?.path === path && item.route.methods[method]
  })

  if (!layer) return []

  return layer.route.stack.filter((item) => item.method === method)
}

const assertRouteUses = (path, method, middleware) => {
  const stack = getRouteMethodStack(path, method)

  assert.ok(
    stack.some((item) => item.handle === middleware),
    `${method.toUpperCase()} ${path} must use ${middleware.name}`,
  )
}

const assertGuestRequiresAuthentication = () => {
  let capturedError

  try {
    authenticationMiddleware({ signedCookies: {} }, {}, () => {})
  } catch (error) {
    capturedError = error
  }

  assert.equal(capturedError.statusCode, 401)
}

const assertUserIsForbidden = () => {
  let capturedError

  try {
    authorizationMiddleware({ user: { role: 'user' } }, {}, () => {})
  } catch (error) {
    capturedError = error
  }

  assert.equal(capturedError.statusCode, 403)
}

afterEach(() => {
  mock.restoreAll()
})

test('regression B-006: guest GET /products -> 200', async () => {
  const product = { _id: new mongoose.Types.ObjectId(), name: 'Gift' }

  assertRouteUses('/', 'get', publicCatalogRateLimit)
  mock.method(Product, 'find', () => ({
    sort: async () => [product],
  }))

  const response = createResponse()

  await getAllProducts({ query: {} }, response)

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.body.products, [product])
})

test('regression B-006: guest POST /products -> 401', () => {
  assertRouteUses('/', 'post', authenticationMiddleware)
  assertGuestRequiresAuthentication()
})

test('user POST /products -> 403', () => {
  assertRouteUses('/', 'post', authorizationMiddleware)
  assertUserIsForbidden()
})

test('admin POST /products -> 201', async () => {
  const product = { _id: new mongoose.Types.ObjectId(), name: 'Admin Gift' }

  mock.method(Product, 'create', async () => product)

  const response = createResponse()

  await createProduct({ body: product, user: { role: 'admin' } }, response)

  assert.equal(response.statusCode, 201)
  assert.equal(response.body.product, product)
})

test('guest GET /products/:id -> 200', async () => {
  const product = { _id: new mongoose.Types.ObjectId(), name: 'Gift' }

  assertRouteUses('/:id', 'get', publicCatalogRateLimit)
  mock.method(Product, 'findById', async () => product)

  const response = createResponse()

  await getProduct({ params: { id: product._id.toString() } }, response)

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.product, product)
})

test('guest DELETE /products/:id -> 401', () => {
  assertRouteUses('/:id', 'delete', authenticationMiddleware)
  assertGuestRequiresAuthentication()
})
