import LayoutWrapper from '@/components/admin/LayoutWrapper'

// Force all admin pages to be dynamic (no static generation)
export const dynamic = 'force-dynamic'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <LayoutWrapper>{children}</LayoutWrapper>
}
