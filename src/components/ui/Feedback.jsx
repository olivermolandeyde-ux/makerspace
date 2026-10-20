export function Spinner({ className = "h-5 w-5" }) {
  return (
    <span
      aria-hidden="true"
      className={`${className} inline-block animate-spin rounded-full border-2 border-current border-t-transparent`}
    />
  )
}

export function LoadingBlock({ label = "Laster …" }) {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-muted" role="status">
      <Spinner />
      <span>{label}</span>
    </div>
  )
}

export function ErrorNotice({ message, details, className = "" }) {
  if (!message) return null

  return (
    <div
      role="alert"
      className={`rounded-2xl border border-red-200 bg-danger-soft px-4 py-3 text-sm text-red-900 ${className}`}
    >
      <p className="font-semibold">{message}</p>
      {details && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs font-medium text-red-800">
            Vis tekniske detaljer
          </summary>
          <p className="mt-1 break-words text-xs text-red-800">{details}</p>
        </details>
      )}
    </div>
  )
}

export function SuccessNotice({ message, className = "" }) {
  if (!message) return null

  return (
    <div
      role="status"
      className={`rounded-2xl border border-green-200 bg-success-soft px-4 py-3 text-sm font-medium text-success ${className}`}
    >
      {message}
    </div>
  )
}

export function EmptyState({ title, description, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 px-6 py-12 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-md text-sm text-muted">{description}</p>}
      {children && <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>}
    </div>
  )
}

export function StatusBadge({ active, activeLabel = "Aktiv", inactiveLabel = "Inaktiv" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? "bg-success-soft text-success" : "bg-gray-100 text-gray-500"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-success" : "bg-gray-400"}`} />
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}

export function PageHeader({ eyebrow, title, description, children }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">
            {eyebrow}
          </p>
        )}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-lead">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  )
}
