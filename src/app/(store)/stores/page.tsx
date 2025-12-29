import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Clock, Mail, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getAllStoreLocations } from '@/lib/actions/store-location'

export const metadata: Metadata = {
  title: 'Store Locator | Dude Mens Wear',
  description: 'Find Dude Mens Wear stores near you. Visit our flagship store in Mumbai for the latest men\'s fashion.',
}

export default async function StoresPage() {
  const { data: stores = [] } = await getAllStoreLocations()

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black py-16 lg:py-24">
        <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-5" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-white lg:text-5xl">
            FIND YOUR STORE
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-gray-300">
            Visit us in person for the complete Dude experience. Try on our latest collections and get personalized styling advice.
          </p>
        </div>
      </section>

      {/* Stores List */}
      <section className="mx-auto max-w-7xl px-4 py-12 lg:py-16">
        {stores.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-body text-gray-600">No store locations available at the moment.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {stores.map((store) => {
              const fullAddress = [
                store.address_line1,
                store.address_line2
              ].filter(Boolean).join(', ')

              const mapUrl = store.latitude && store.longitude
                ? `https://maps.google.com/?q=${store.latitude},${store.longitude}`
                : `https://maps.google.com/?q=${encodeURIComponent(`${fullAddress}, ${store.city}, ${store.state}`)}`

              return (
                <div key={store.id} className="grid gap-6 lg:grid-cols-2">
                  {/* Map Card - Left Side */}
                  <Card className="overflow-hidden border-2 border-gray-200 transition-shadow hover:shadow-lg">
                    <CardContent className="p-0">
                      <div className="relative h-96">
                        {store.latitude && store.longitude ? (
                          <iframe
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${store.latitude},${store.longitude}&zoom=15`}
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="absolute inset-0"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100">
                            <div className="text-center">
                              <MapPin className="mx-auto h-16 w-16 text-red-600" />
                              <p className="mt-4 font-heading text-lg font-bold text-gray-700">
                                {store.city}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="absolute left-4 top-4 z-10">
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 shadow-md">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                            Open Now
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address Card - Right Side */}
                  <Card className="overflow-hidden border-2 border-gray-200 transition-shadow hover:shadow-lg">
                    <CardContent className="p-6">
                      <h2 className="font-heading text-2xl font-bold text-gray-900">
                        {store.name}
                      </h2>

                      <div className="mt-6 space-y-4">
                        {/* Address */}
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                          <div className="font-body text-base text-gray-700">
                            <p className="font-medium">{fullAddress}</p>
                            <p>{store.city}, {store.state} - {store.pincode}</p>
                            {store.country && <p>{store.country}</p>}
                          </div>
                        </div>

                        {/* Phone */}
                        {store.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 flex-shrink-0 text-red-600" />
                            <a
                              href={`tel:${store.phone}`}
                              className="font-body text-base text-gray-700 hover:text-red-600 font-medium"
                            >
                              {store.phone}
                            </a>
                          </div>
                        )}

                        {/* Email */}
                        {store.email && (
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 flex-shrink-0 text-red-600" />
                            <a
                              href={`mailto:${store.email}`}
                              className="font-body text-base text-gray-700 hover:text-red-600 font-medium"
                            >
                              {store.email}
                            </a>
                          </div>
                        )}

                        {/* Hours */}
                        <div className="flex items-start gap-3">
                          <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                          <div className="font-body text-base text-gray-700">
                            <p className="font-medium mb-1">Store Hours</p>
                            <p><span className="text-gray-500">Mon - Fri:</span> 10:00 AM - 9:00 PM</p>
                            <p><span className="text-gray-500">Saturday:</span> 10:00 AM - 10:00 PM</p>
                            <p><span className="text-gray-500">Sunday:</span> 11:00 AM - 8:00 PM</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-8 flex flex-wrap gap-3">
                        <Button asChild className="bg-red-600 hover:bg-red-700 flex-1">
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Navigation className="mr-2 h-4 w-4" />
                            Get Directions
                          </a>
                        </Button>
                        {store.phone && (
                          <Button variant="outline" asChild className="flex-1">
                            <a href={`tel:${store.phone}`}>
                              <Phone className="mr-2 h-4 w-4" />
                              Call Store
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
