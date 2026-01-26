import mongoose from 'mongoose'
const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    total: {
      type: Number,
    },

    status: {
      type: String,
      enum: ['active', 'ordered', 'abandoned'],
      default: 'active',
    },
  },
  { timestamps: true },
)

CartSchema.index({ userId: 1, 'products.product': 1 }, { unique: true })

export default new mongoose.model('Cart', CartSchema)
