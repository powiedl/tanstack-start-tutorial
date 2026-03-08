import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/items/')({
  component: RouteComponent,
})

function RouteComponent() {
  const data = Route.useLoaderData()
  return <div>Hello "/dashboard/items/"!</div>
}
