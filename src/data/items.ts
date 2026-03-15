import { prisma } from '#/db'
import { firecrawl } from '#/lib/firecrawl'
import { sleep } from '#/lib/utils'
import { authFnMiddleware } from '#/middlewares/auth'
import { bulkImportSchema, extractSchema, importSchema } from '#/schemas/import'
import { createServerFn } from '@tanstack/react-start'
import { notFound } from '@tanstack/react-router'
import z from 'zod'
import { generateText } from 'ai'
import { openrouter } from '#/lib/openrouter'

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
        location: { country: 'US', languages: ['en'] },
        onlyMainContent: true,
      })
      //console.log('result.json', result.json)
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
      //console.log('After updatedItem')

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

export const mapUrlFn = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(bulkImportSchema)
  .handler(async ({ data }) => {
    const result = await firecrawl.map(data.url, {
      limit: 25,
      search: data.search,
      location: { country: 'US', languages: ['en'] },
    })

    return result.links
  })

export const bulkScrapeUrlsFn = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(
    z.object({
      urls: z.array(z.url()),
    }),
  )
  .handler(async ({ data, context }) => {
    for (let i = 0; i < data.urls.length; i++) {
      const url = data.urls[i]

      const item = await prisma.savedItem.create({
        data: {
          id: url + Date.now().toString(36),
          url: url,
          userId: context.session.user.id,
          status: 'PENDING',
        },
      })

      try {
        const result = await firecrawl.scrape(url, {
          formats: [
            'markdown',
            {
              type: 'json',
              //schema: extractSchema // zod v4 is currently not supported by firecrawl
              prompt:
                'please extract the author and also publishedAt timestamp',
            },
          ],
          location: { country: 'US', languages: ['en'] },
          onlyMainContent: true,
        })
        //console.log('result.json', result.json)
        const jsonData: z.infer<typeof extractSchema> =
          (result?.json as z.infer<typeof extractSchema>) || {
            author: null,
            publishedAt: null,
          }
        let publishedAt = null

        if (jsonData.publishedAt) {
          const parsed = new Date(jsonData.publishedAt)

          if (!isNaN(parsed.getTime())) {
            publishedAt = parsed
          }
        }

        await prisma.savedItem.update({
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
        //console.log('After updatedItem')
      } catch {
        await prisma.savedItem.update({
          where: {
            id: item.id,
          },
          data: {
            status: 'FAILED',
          },
        })
      }
    }
  })

export const getItemsFn = createServerFn({ method: 'GET' })
  .middleware([authFnMiddleware])
  .handler(async ({ context }) => {
    await sleep(10) // Parameter auf 2000 setzen, wenn man eine langsame Api simulieren will
    const items = await prisma.savedItem.findMany({
      where: {
        userId: context.session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return items
  })

export const getItemById = createServerFn({ method: 'GET' })
  .middleware([authFnMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ context, data }) => {
    const item = await prisma.savedItem.findUnique({
      where: {
        userId: context.session.user.id,
        id: data.id,
      },
    })
    if (!item) throw notFound()
    return item
  })

export const saveSummaryAndGenerateTagsFn = createServerFn({ method: 'POST' })
  .middleware([authFnMiddleware])
  .inputValidator(
    z.object({
      id: z.string(),
      summary: z.string(),
    }),
  )
  .handler(async ({ context, data }) => {
    const existing = await prisma.savedItem.findUnique({
      where: {
        id: data.id,
        userId: context.session.user.id,
      },
    })
    if (!existing) {
      throw notFound()
    }

    const { text } = await generateText({
      model: openrouter.chat('openrouter/free'),
      system: `You are a helpful assistant that extracts relevant tags from content summaries.
      Extract 3-5 short, relevant tags that categorize the content.
      Return ONLY a comma-separated list of tags, nothing els.
      Example: technology, programming, web development, javascript,`,
      prompt: `Extract tags from this summary: \n\n${data.summary}`,
    })
    const tags = text
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)
      .slice(0, 5)

    const item = await prisma.savedItem.update({
      where: {
        userId: context.session.user.id,
        id: data.id,
      },
      data: {
        summary: data.summary,
        tags: tags,
      },
    })
    return item
  })
