import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/')({
  component: RouteComponent,
  loader: () => {
    return {
      name: 'jan marshal',
      age: 50,
    }
  },
})

function RouteComponent() {
  return <div>Hello "/dashboard/"!</div>
}
