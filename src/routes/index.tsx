import Navbar from '#/components/web/navbar'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <div>
      <Navbar />
      {/* <Link to="/about">about link</Link>
      <Link to="/abc">abc link</Link>
      <Link to="/users/public/list">/users/public/list link</Link>
      <Link to=""> 
        fgad link - geht nicht, weil die Route nicht geht (im VSCode sollte das to in diesem Link rot unterwellt sein!)
      </Link>*/}
    </div>
  )
}
