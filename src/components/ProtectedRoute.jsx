import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "../context/useAuth"
import { LoadingBlock } from "./ui/Feedback"

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <LoadingBlock label="Sjekker innlogging …" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
