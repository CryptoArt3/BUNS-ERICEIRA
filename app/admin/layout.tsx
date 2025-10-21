import '../globals.css'
import type { Metadata } from 'next'
import AdminGuard from '@/components/AdminGuard'
import AdminHeader from '@/components/AdminHeader'

export const metadata: Metadata = {
  title: 'BUNS — Admin',
  description: 'Backoffice de pedidos',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminHeader />
      {children}
    </AdminGuard>
  )
}
