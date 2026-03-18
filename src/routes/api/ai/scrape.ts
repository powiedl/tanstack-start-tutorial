//import { prisma } from '#/db'
import { openrouter } from '#/lib/openrouter'
import { createFileRoute } from '@tanstack/react-router'
import { streamText } from 'ai'
import axios from 'axios'

export const Route = createFileRoute('/api/ai/scrape')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { url } = await request.json()
        if (!url) {
          return new Response('Missing url', { status: 400 })
        }

        const { data: htmlContent } = await axios.get(url)
        //console.log(`Content von ${url}:`, htmlContent)

        // stream summary
        const result = streamText({
          model: openrouter.chat('openrouter/free'),
          system: `You are a helpful assistant that creates a precise transformation to markdown of a web page. The user provides the html code in the prompt.
            Follow these rules:
            - Just return the mark down with no extra information
            - If the web page contains images embed the links to the images in the markdown
            - Be as close as possible to the web page content
            `,
          prompt: `Please convert this html to markdown:\n\n${htmlContent}`,
        })

        // Return the stream in the format useCompletion expects
        return result.toTextStreamResponse()
      },
    },
  },
})
