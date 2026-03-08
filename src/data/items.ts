import { prisma } from '#/db'
import { firecrawl } from '#/lib/firecrawl'
import { authFnMiddleware } from '#/middlewares/auth'
import { extractSchema, importSchema } from '#/schemas/import'
import { createServerFn } from '@tanstack/react-start'
import type z from 'zod'

// Test: https://www.finanzen.at/aktien/apple-aktie

export const scrapeUrlFn = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(importSchema)
  .handler(async ({ data, context }) => {
    const item = await prisma.savedItem.create({
      data: {
        id: data.url + Date.now().toString(36),
        url: data.url,
        userId: context.session.user.id,
        status: 'PROCESSING',
      },
    })

    try {
      const result = await firecrawl.scrape(data.url, {
        formats: [
          'markdown',
          {
            type: 'json',
            //schema: extractSchema // zod v4 is currently not supported by firecrawl
            prompt: 'please extract the author and also publishedAt timestamp',
          },
        ],
        onlyMainContent: true,
      })
      console.log('result.json', result.json)
      const jsonData: z.infer<typeof extractSchema> = (result?.json as z.infer<
        typeof extractSchema
      >) || { author: null, publishedAt: null }
      let publishedAt = null

      if (jsonData.publishedAt) {
        const parsed = new Date(jsonData.publishedAt)

        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed
        }
      }

      const updatedItem = await prisma.savedItem.update({
        where: {
          id: item.id,
        },
        data: {
          title: result.metadata?.title || null,
          content: result.markdown || null,
          ogImage: result.metadata?.ogImage || null,
          author: jsonData?.author || null,
          publishedAt: publishedAt,
          status: 'COMPLETED',
        },
      })
      console.log('After updatedItem')

      return updatedItem
    } catch {
      const failedItem = await prisma.savedItem.update({
        where: {
          id: item.id,
        },
        data: {
          status: 'FAILED',
        },
      })
      return failedItem
    }
  })
