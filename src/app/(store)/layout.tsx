import WhatsAppButton from '@/components/WhatsAppButton'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <WhatsAppButton />
    </>
  )
}
