import express from 'express'
import * as dotenv from 'dotenv'
import 'express-async-errors'
import morgan from 'morgan'
import mongoose from 'mongoose'
import cors from 'cors'
import fileUpload from 'express-fileupload'
dotenv.config()
const app = express()
app.use(express.static('public'))
app.use(express.json())
app.use(fileUpload())
import cookieParser from 'cookie-parser'
app.use(cookieParser())
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}
app.use(express.urlencoded({ extended: true }))

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  }),
)

//Errors
import { NotFoundError } from './errors/errors.js'

// Routes
import authRouter from './routes/authRoutes.js'
import productRouter from './routes/productRoutes.js'
import cartRouter from './routes/cartRoutes.js'
import categoryRouter from './routes/categoryRoutes.js'
import orderRouter from './routes/orderRoutes.js'

//Middlewares
import { handleErrorsMiddleware } from './middlewares/handleErrorsMiddleware.js'
import { authorizationMiddleware } from './middlewares/authorizationMiddleware.js'
import { authenticationMiddleware } from './middlewares/handleAuthMiddleware.js'

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/cart', authenticationMiddleware, cartRouter)
app.use('/api/v1/products', productRouter)
app.use(
  '/api/v1/category',
  authenticationMiddleware,
  authorizationMiddleware,
  categoryRouter,
)

app.use('/api/v1/orders', authenticationMiddleware, orderRouter)

app.get('/', (req, res) => {
  res.send('Hello ')
})

app.get('*', (req, res) => {
  throw new NotFoundError('Not found')
})
app.use(handleErrorsMiddleware)

const port = process.env.PORT || 5100

app.listen(port, async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log(`Server is listening on port ${port}...`)
})
