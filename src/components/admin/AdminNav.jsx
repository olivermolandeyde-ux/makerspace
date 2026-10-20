import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/useAuth"
import { Spinner } from "../ui/Feedback"

const links = [
  { to: "/admin", label: "Oversikt", end: true },
  { to: "/admin/materialer", label: "Materialer" },
  { to: "/admin/maskiner", label: "Maskiner" },
  { to: "/admin/avdelinger", label: "Avdelinger" },
  { to: "/admin/historikk", label: "Historikk" },
  { to: "/admin/rapporter", label: "Rapporter" },
  { to: "/admin/qr", label: "QR-kode" },
]

export default function AdminNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      navigate("/admin/login", { replace: true })
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <div className="no-print mb-6">
      <div className="card p-2 sm:p-3">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <nav aria-label="Administrasjon" className="flex gap-1 overflow-x-auto pb-1 xl:pb-0">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-brand-500 text-ink shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-ink"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-2 pt-2 xl:border-0 xl:pt-0">
            <span className="max-w-52 truncate text-xs text-muted" title={user?.email || ""}>
              {user?.email}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-ghost shrink-0"
            >
              {loggingOut ? <Spinner className="h-4 w-4" /> : null}
              Logg ut
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
