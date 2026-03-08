import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/items/')({
  component: RouteComponent,
  loader: () => {
    return { name: 'powidl', age: 50 }
  },
})

function RouteComponent() {
  const data = Route.useLoaderData()
  return <div>Hello {data.name} to "/dashboard/items/"!</div>
}
