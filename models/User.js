import mongoose from 'mongoose'

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: 'user',
    },
    verificationToken: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Date,
    },
  },
  { timestamps: true },
)

export default mongoose.model('User', UserSchema)
