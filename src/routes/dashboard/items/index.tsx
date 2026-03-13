import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { getItemsFn } from '#/data/items'
import { ItemStatus } from '#/generated/prisma/enums'
import { copyToClipboard } from '#/lib/clipboard'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { CopyIcon } from 'lucide-react'
import z from 'zod'
import { zodValidator } from '@tanstack/zod-adapter'
import { useEffect, useState } from 'react'

const itemsSearchSchema = z.object({
  q: z.string().default(''),
  status: z.union([z.literal('all'), z.nativeEnum(ItemStatus)]).default('all'),
})
export const Route = createFileRoute('/dashboard/items/')({
  component: RouteComponent,
  loader: () => getItemsFn(),
  validateSearch: zodValidator(itemsSearchSchema),
})

function RouteComponent() {
  const data = Route.useLoaderData()
  const { q, status } = Route.useSearch()
  const [searchInput, setSearchInput] = useState(q)
  const navigate = useNavigate({ from: Route.fullPath })

  useEffect(() => {
    console.log('searchInput', searchInput, 'q', q)
    if (searchInput === q) return
    const timeoutId = setTimeout(() => {
      navigate({ search: (p) => ({ ...p, q: searchInput }) })
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput, navigate, q])
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="">
        <h1 className="text-2xl font-bold">Saved Items</h1>
        <p className="text-muted-foreground">
          Your saved articles and content!
        </p>
      </div>

      <div className="flex gap-4">
        {/* Search and filter controls */}
        <Input
          placeholder="Search by title or tags"
          className=""
          value={searchInput}
          onChange={(e) => {
            setSearchInput(e.target.value)
          }}
        />

        <Select
          value={status}
          onValueChange={(value) =>
            navigate({
              search: (p) => ({
                ...p,
                status: value as typeof status,
              }),
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.values(ItemStatus).map((status) => (
              <SelectItem key={status} value={status} className="capitalize">
                {status.toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {data.map((item) => (
          <Card
            key={item.id}
            className="group overflow-hidden transistion-all hover:shadow-lg pt-0"
          >
            <Link to="/dashboard" className="block">
              {item.ogImage && (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={item.ogImage}
                    alt={item.title ?? 'Article Thumbnail'}
                    className="h-full w-full object-cover group-hover:scale-105"
                  />
                </div>
              )}
              <CardHeader className="space-y-3 pt-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={
                      item.status === 'COMPLETED' ? 'default' : 'secondary'
                    }
                  >
                    {item.status}
                  </Badge>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    type="button"
                    onClickCapture={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      await copyToClipboard(item.url)
                    }}
                  >
                    <CopyIcon className="size-4" />
                  </Button>
                </div>
                <CardTitle className="line-clamp-1 text-xl leading-snug group-hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>
                {item.author && (
                  <p className="text-xs text-muted-foreground">{item.author}</p>
                )}
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
