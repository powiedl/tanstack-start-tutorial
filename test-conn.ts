// test-conn.ts
import { PrismaClient } from './src/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!, // oder ein harter Wert
})
const client = new PrismaClient({ adapter })

async function main() {
  await client.user.findFirst()
  console.log('ok')
}
main()
  .catch(console.error)
  .finally(() => client.$disconnect())
