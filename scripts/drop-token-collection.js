import * as dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const ALLOWED_ENVIRONMENTS = new Set(['development', 'test'])
const TOKEN_COLLECTION_NAME = 'tokens'

const dropTokenCollection = async () => {
  const nodeEnv = process.env.NODE_ENV || 'development'

  if (!ALLOWED_ENVIRONMENTS.has(nodeEnv)) {
    throw new Error(
      `Refusing to drop ${TOKEN_COLLECTION_NAME} outside development/test`,
    )
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required')
  }

  await mongoose.connect(process.env.MONGO_URI)

  try {
    await mongoose.connection.collection(TOKEN_COLLECTION_NAME).drop()
    console.log(`${TOKEN_COLLECTION_NAME} collection dropped`)
  } catch (error) {
    if (error.codeName !== 'NamespaceNotFound') {
      throw error
    }

    console.log(`${TOKEN_COLLECTION_NAME} collection does not exist`)
  } finally {
    await mongoose.disconnect()
  }
}

dropTokenCollection().catch(async (error) => {
  console.error(error.message)
  await mongoose.disconnect()
  process.exitCode = 1
})
