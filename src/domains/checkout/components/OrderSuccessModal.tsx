'use client'

interface OrderSuccessModalProps {
  orderCompleted: {
    order: {
      id: string
      display_id: string
    }
  }
  onClose: () => void
}

export default function OrderSuccessModal({ orderCompleted, onClose }: OrderSuccessModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold mb-2">Order Placed Successfully!</h3>
          <p className="text-gray-600 mb-6">
            Your order #{orderCompleted.order.display_id} has been confirmed.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-blue-900 mb-2">Create an Account</h4>
            <p className="text-sm text-blue-700 mb-3">
              Save your details for faster checkout next time and track your orders easily.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = '/auth/signup'}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign Up
              </button>
              <button
                onClick={() => window.location.href = '/auth/login'}
                className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
          
          <button
            onClick={() => window.location.href = `/order/confirmed/${orderCompleted.order.id}`}
            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Continue as Guest
          </button>
          
          <p className="text-xs text-gray-500 mt-3">
            You can always create an account later from your order confirmation email.
          </p>
        </div>
      </div>
    </div>
  )
}
