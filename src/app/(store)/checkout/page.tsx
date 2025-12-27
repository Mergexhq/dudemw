import dynamic from 'next/dynamic'

const CheckoutPage = dynamic(() => import('@/domains/checkout').then(mod => ({ default: mod.CheckoutPage })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    </div>
  )
})

export default function Checkout() {
  return <CheckoutPage />
}
