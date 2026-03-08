const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 border-b bg-amber-50 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img
            src="https://tanstack.com/images/logos/logo-color-banner-600.png"
            alt="TanStack Start Logo"
            className="size-9"
          />
          <h1 className="text-xl font-bold">TanStack Start</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-white bg-red-500 px-3 py-1 rounded-lg">
            Sign up
          </button>
        </div>
      </div>
    </nav>
  )
}
export default Navbar
