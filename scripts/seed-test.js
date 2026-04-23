import * as dotenv from 'dotenv'
import mongoose from 'mongoose'

import { seedDatabase } from './seed.js'

dotenv.config()

const reset = process.argv.includes('--reset')

seedDatabase({ env: 'test', minimal: true, reset })
  .then((result) => {
    console.info('Test seed completed', result)
  })
  .catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
  .finally(async () => {
    await mongoose.disconnect()
  })
