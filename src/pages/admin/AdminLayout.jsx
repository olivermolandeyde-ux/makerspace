import { Outlet } from "react-router-dom"
import Navbar from "../../components/Navbar"
import AdminNav from "../../components/admin/AdminNav"

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 pt-6">
        <AdminNav />
      </div>
      <main className="mx-auto max-w-6xl px-4 pb-16 print:max-w-none print:px-0 print:pb-0">
        <Outlet />
      </main>
    </div>
  )
}
