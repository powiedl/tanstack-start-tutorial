import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Checkbox } from '#/components/ui/checkbox'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { Progress } from '#/components/ui/progress'
import {
  bulkScrapeUrlsFn,
  searchWebFn,
  type BulkScrapeProgress,
} from '#/data/items'
import { searchSchema } from '#/schemas/import'
import type { SearchResultWeb } from '@mendable/firecrawl-js'
import { useForm } from '@tanstack/react-form'
import { createFileRoute } from '@tanstack/react-router'
import { Loader2, Search, Sparkles } from 'lucide-react'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/dashboard/discover')({
  component: RouteComponent,
})

// const defaultSearchResults = JSON.parse(
//   '[{"url":"https://www.reddit.com/r/reactjs/comments/1lsxico/seeking_advice_on_choosing_between_nextjs_and/","title":"Seeking advice on choosing between Next.js and TanStack Start","description":"NextJS is an unreliable mess that breaks major features in every new release. Most recent example was them deprecating the pages router and telling everyone to ..."},{"url":"https://www.kylegill.com/essays/next-vs-tanstack/","title":"Next.js vs TanStack - Kyle Gill","description":"TanStack, while not perfect either, provides better abstractions that are more than adequate for the vast majority of projects."},{"url":"https://tanstack.com/start/latest/docs/framework/react/start-vs-nextjs","title":"TanStack Start vs Next.js","description":"Start has full RSC support with feature parity to Next.js. The difference is mental model and cognitive overhead. In Next, RSCs are the paradigm - you build ..."},{"url":"https://appwrite.io/blog/post/why-developers-leaving-nextjs-tanstack-start","title":"Why developers are leaving Next.js for TanStack Start, and loving it","description":"Many devs say TanStack Start lets them scale from side projects to production without losing control or adding complexity."},{"url":"https://crystallize.com/blog/next-vs-tanstack-start","title":"Next.js 16 vs. TanStack Start for E-commerce - Crystallize.com","description":"TanStack Start is leaner and may let developers move faster on complex data flows, but with more initial setup. Next.js aims for zero-config and many built-in ..."}]',
// ) as SearchResultWeb[]

function RouteComponent() {
  const [isPending, startTransition] = useTransition()
  const [searchResults, setSearchResults] = useState<Array<SearchResultWeb>>([])
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [isBulkPending, startBulkTransition] = useTransition()
  const [progress, setProgress] = useState<BulkScrapeProgress | null>(null)
  function handleSelectAll() {
    if (selectedUrls.size === searchResults.length) {
      setSelectedUrls(new Set())
    } else {
      setSelectedUrls(new Set(searchResults.map((link) => link.url)))
    }
  }
  function handleToggleUrl(url: string) {
    const newSelected = new Set(selectedUrls)
    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      newSelected.add(url)
    }
    setSelectedUrls(newSelected)
  }

  function handleBulkImport() {
    startBulkTransition(async () => {
      if (selectedUrls.size === 0) {
        toast.error('Please select at least one Url to import')
        return
      }

      let successCount = 0
      let failedCount = 0
      setProgress({
        completed: 0,
        total: selectedUrls.size,
        url: '',
        status: 'success',
      })

      // await bulkScrapeUrlsFn({
      //   data: { urls: Array.from(selectedUrls) },
      // })

      for await (const update of await bulkScrapeUrlsFn({
        data: { urls: Array.from(selectedUrls) },
      })) {
        setProgress(update)
        if (update.status === 'success') {
          successCount++
        } else {
          failedCount++
        }
      }

      setProgress(null)
      if (failedCount > 0) {
        if (successCount > 0) {
          toast.success(`Imported ${successCount} Urls (${failedCount} failed)`)
        } else {
          toast.error(`Import of all ${failedCount} Urls failed`)
        }
      } else {
        toast.success(`Imported all ${successCount} Urls successfully`)
      }
    })
  }
  const form = useForm({
    defaultValues: {
      query: '',
    },
    validators: {
      onSubmit: searchSchema,
    },
    onSubmit: ({ value }) => {
      startTransition(async () => {
        const result = await searchWebFn({ data: { query: value.query } })
        //console.log(result)
        setSearchResults(result)
      })
    },
  })

  return (
    <div className="flex flex-1 items-center justify-center py-8">
      <div className="w-full max-w-2xl space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Discover</h1>
          <p className="text-muted-foreground pt-2">
            Search the web for articles on any topic.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Sparkles className="size-5 text-primary" />
              Topic Search
            </CardTitle>
            <CardDescription>
              Search the web content and import what you find interesting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
            >
              <FieldGroup>
                <form.Field
                  name="query"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Search Query
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="e. g. React server compontent tutorial"
                          autoComplete="off"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
                <Button disabled={isPending} type="submit">
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="size-4" />
                      Search web
                    </>
                  )}
                </Button>
              </FieldGroup>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Found {searchResults.length} URLs
                  </p>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedUrls.size === searchResults.length
                      ? 'Deselect All'
                      : 'Select all'}
                  </Button>
                </div>
                <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border p-4">
                  {searchResults.map((link) => (
                    <label
                      key={link.url}
                      className="hover:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-md p-2"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={selectedUrls.has(link.url)}
                        onCheckedChange={() => handleToggleUrl(link.url)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {link.title ?? 'Title has not been found'}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {link.description ?? 'Description has not been found'}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {link.url}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                {progress && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Importing: {progress.completed} / {progress.total}
                      </span>
                      <span className="font-medium">
                        {Math.round(progress.completed / progress.total) * 100}
                      </span>
                    </div>
                    <Progress
                      value={(progress.completed / progress.total) * 100}
                    />
                  </div>
                )}
                <Button
                  className="w-full"
                  onClick={handleBulkImport}
                  disabled={isBulkPending}
                  type="button"
                >
                  {isBulkPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      {progress
                        ? `Importing ${progress.completed}/${progress.total}...`
                        : 'Starting'}
                    </>
                  ) : (
                    `Import ${selectedUrls.size} Urls`
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
