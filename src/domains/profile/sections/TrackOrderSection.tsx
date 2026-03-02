'use client'

import { useState } from 'react'
import { Search, Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { getOrderForTrackingAction } from '@/lib/actions/orders'

export default function TrackOrderSection() {
  const [orderNumber, setOrderNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [tracking, setTracking] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSearching(true)

    // Validate phone number (Indian 10-digit format)
    const phoneRegex = /^[0-9]{10}$/
    if (!phoneRegex.test(phoneNumber.trim())) {
      setTracking({
        orderNumber: orderNumber,
        status: 'error',
        timeline: [
          { status: 'Invalid Phone Number', date: 'Please enter a valid 10-digit phone number', completed: false }
        ]
      })
      setIsSearching(false)
      return
    }

    try {
      const result = await getOrderForTrackingAction(orderNumber.trim(), phoneNumber.trim())

      if (!result.success || !result.data) {
        setTracking({
          orderNumber: orderNumber,
          status: 'not_found',
          timeline: []
        })
        setIsSearching(false)
        return
      }

      const orderData = result.data

      // Generate timeline based on order status
      const generateTimeline = (status: string, createdAt: string) => {
        const orderDate = new Date(createdAt).toLocaleDateString()
        const timeline = [
          { status: 'Order Placed', date: orderDate, completed: true }
        ]

        if (['processing', 'shipped', 'delivered'].includes(status)) {
          timeline.push({ status: 'Processing', date: orderDate, completed: true })
        }

        if (['shipped', 'delivered'].includes(status)) {
          timeline.push({ status: 'Shipped', date: orderDate, completed: true })
        }

        if (status === 'delivered') {
          timeline.push({ status: 'Delivered', date: orderDate, completed: true })
        } else if (status === 'shipped') {
          timeline.push({ status: 'Out for Delivery', date: 'Expected soon', completed: false })
          timeline.push({ status: 'Delivered', date: 'Expected', completed: false })
        } else {
          timeline.push({ status: 'Processing', date: 'In progress', completed: false })
          timeline.push({ status: 'Shipped', date: 'Pending', completed: false })
          timeline.push({ status: 'Delivered', date: 'Pending', completed: false })
        }

        return timeline
      }

      setTracking({
        orderNumber: orderData.id,
        status: orderData.order_status || 'pending',
        timeline: generateTimeline(orderData.order_status || 'pending', orderData.created_at || new Date().toISOString())
      })
    } catch (error) {
      console.error('Error tracking order:', error)
      setTracking({
        orderNumber: orderNumber,
        status: 'error',
        timeline: [
          { status: 'Error', date: 'Unable to track order. Please try again later.', completed: false }
        ]
      })
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="w-full">
      {/* Expanding Card Container */}
      <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-700 ease-in-out">

        {/* Persistent Background - Anchored to Top Right */}
        <div
          className="absolute right-0 top-0 w-full h-[400px] z-0 pointer-events-none"
          style={{
            backgroundImage: "url('/illustration/track_order.png')",
            backgroundPosition: "top right",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            opacity: 0.95
          }}
        />

        <div className="relative z-10 flex flex-col">
          {/* Header & Form Section */}
          <div className="p-8 md:p-12 max-w-xl">
            <h2 className="text-3xl font-bold text-black mb-8">
              Track Your Order
            </h2>

            <form onSubmit={handleTrack} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-tight">
                  Order Number
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g., #6D0615DE"
                  className="w-full md:w-1/2 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900 placeholder-gray-400 shadow-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-tight">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="9876543210"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  className="w-full md:w-1/2 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-gray-900 placeholder-gray-400 shadow-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-2 font-medium">Enter 10-digit phone number without +91</p>
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="w-full md:w-1/2 bg-black text-white py-4 rounded-lg font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 mt-6 shadow-xl active:scale-[0.98] group disabled:opacity-70"
              >
                {isSearching ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                )}
                {isSearching ? 'Searching...' : 'Track Order'}
              </button>
            </form>
          </div>

          {/* Results Section - Downward Expansion Area */}
          {tracking && (
            <div className="border-t border-gray-100 bg-white/40 backdrop-blur-sm animate-in fade-in slide-in-from-top-6 duration-700 ease-out">
              <div className="p-8 md:p-12 max-w-4xl mx-auto">

                {tracking.status === 'not_found' || tracking.status === 'error' ? (
                  /* Clean Empty State UI */
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                      <XCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-black mb-2">
                      Order {tracking.orderNumber.startsWith('#') ? '' : '#'}{tracking.orderNumber} Not Found
                    </h3>
                    <p className="text-gray-600 max-w-md mb-8">
                      We couldn't find an order matching that ID and phone number. Please double-check the details and try again.
                    </p>
                    <button
                      onClick={() => setTracking(null)}
                      className="px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-zinc-800 transition-all shadow-lg overflow-hidden"
                    >
                      Try Another Search
                    </button>
                  </div>
                ) : (
                  /* Success Results UI */
                  <>
                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-100">
                      <div className="space-y-1">
                        <h3 className="font-bold text-2xl text-black">
                          Order {tracking.orderNumber.toString().startsWith('#') ? '' : '#'}{tracking.orderNumber.toString().slice(-8).toUpperCase()}
                        </h3>
                        <p className="text-sm font-medium">
                          Status: <span className="text-red-600 font-bold uppercase tracking-widest ml-1">{tracking.status}</span>
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-2xl">
                        <Package className="w-8 h-8 text-red-600" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        {tracking.timeline.map((item: any, index: number) => (
                          <div key={index} className="flex gap-6 group">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-colors duration-300 ${item.completed
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'
                                  }`}
                              >
                                {item.completed ? (
                                  <CheckCircle className="w-6 h-6" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors"></div>
                                )}
                              </div>
                              {index < tracking.timeline.length - 1 && (
                                <div
                                  className={`w-0.5 h-16 my-1 transition-colors duration-300 ${item.completed ? 'bg-green-600' : 'bg-gray-200'
                                    }`}
                                ></div>
                              )}
                            </div>
                            <div className="pt-2">
                              <h4
                                className={`font-bold text-lg leading-none mb-2 ${item.completed ? 'text-black' : 'text-gray-400'
                                  }`}
                              >
                                {item.status}
                              </h4>
                              <p className="text-sm text-gray-500 font-medium">{item.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bg-zinc-50/50 rounded-3xl p-8 border border-gray-100 flex flex-col justify-center items-center text-center">
                        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 text-white shadow-xl">
                          <AlertCircle className="w-8 h-8" />
                        </div>
                        <h4 className="font-bold text-xl mb-3">Need Assistance?</h4>
                        <p className="text-gray-600 mb-8 max-w-[240px]">Our support team is available 24/7 to help with any queries.</p>
                        <button className="px-6 py-2 border-2 border-black text-black font-bold rounded-full hover:bg-black hover:text-white transition-all">
                          Contact Support
                        </button>
                      </div>
                    </div>

                    <div className="mt-12 flex justify-center">
                      <button
                        onClick={() => setTracking(null)}
                        className="px-6 py-2 bg-gray-100 hover:bg-black hover:text-white text-gray-900 rounded-full text-sm font-bold transition-all flex items-center gap-2"
                      >
                        &larr; Clear Result
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
