// Centred card used by the login and register pages, which have no navbar.
function AuthCard({ title, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-xl font-bold text-primary">RequestHub</p>
        <div className="rounded-lg border bg-bg-card p-6 sm:p-8">
          <h1 className="mb-6 text-xl font-semibold">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  )
}

export default AuthCard
