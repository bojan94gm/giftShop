import assert from 'node:assert/strict'
import test, { afterEach, mock } from 'node:test'
import mongoose from 'mongoose'

import {
  createCategory,
  getAllCategories,
  getCategory,
} from '../../controllers/categoryController.js'
import { authorizationMiddleware } from '../../middlewares/authorizationMiddleware.js'
import { authenticationMiddleware } from '../../middlewares/handleAuthMiddleware.js'
import { publicCatalogRateLimit } from '../../middlewares/rateLimitMiddleware.js'
import Category from '../../models/Category.js'
import categoryRouter from '../../routes/categoryRoutes.js'

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
  const layer = categoryRouter.stack.find((item) => {
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

const assertUserIsForbidden = () => {
  let capturedError

  try {
    authorizationMiddleware({ user: { role: 'user' } }, {}, () => {})
  } catch (error) {
    capturedError = error
  }

  assert.equal(capturedError.statusCode, 403)
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

afterEach(() => {
  mock.restoreAll()
})

test('regression B-006: guest GET /categories -> 200', async () => {
  const category = { _id: new mongoose.Types.ObjectId(), name: 'Books' }

  assertRouteUses('/', 'get', publicCatalogRateLimit)
  mock.method(Category, 'find', async () => [category])

  const response = createResponse()

  await getAllCategories({}, response)

  assert.equal(response.statusCode, 200)
  assert.deepEqual(response.body.categories, [category])
})

test('guest GET /categories/:id -> 200', async () => {
  const category = { _id: new mongoose.Types.ObjectId(), name: 'Books' }

  assertRouteUses('/:id', 'get', publicCatalogRateLimit)
  mock.method(Category, 'findById', async () => category)

  const response = createResponse()

  await getCategory({ params: { id: category._id.toString() } }, response)

  assert.equal(response.statusCode, 200)
  assert.equal(response.body.category, category)
})

test('guest POST /categories -> 401', () => {
  assertRouteUses('/', 'post', authenticationMiddleware)
  assertGuestRequiresAuthentication()
})

test('user POST /categories -> 403', () => {
  assertRouteUses('/', 'post', authorizationMiddleware)
  assertUserIsForbidden()
})

test('admin POST /categories -> 201', async () => {
  const category = { _id: new mongoose.Types.ObjectId(), name: 'Books' }

  mock.method(Category, 'create', async () => category)

  const response = createResponse()

  await createCategory({ body: { name: 'Books' }, user: { role: 'admin' } }, response)

  assert.equal(response.statusCode, 201)
  assert.equal(response.body.newCategory, category)
})
