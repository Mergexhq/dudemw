'use client'

import { useState, useEffect } from 'react'
import { MapPin, Plus, Edit, Trash2, Check, Eye, X } from 'lucide-react'
import { useAuth } from '@/domains/auth/context'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Address {
  id: string
  user_id: string
  name: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
  created_at?: string
  updated_at?: string
}

interface AddressFormData {
  name: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
}

export default function AddressesSection() {
  const { user } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [viewingAddress, setViewingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState<AddressFormData>({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: ''
  })
  const [formErrors, setFormErrors] = useState<Partial<AddressFormData>>({})
  const [submitting, setSubmitting] = useState(false)

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Puducherry', 'Chandigarh'
  ]

  useEffect(() => {
    if (user?.id) {
      fetchAddresses()
    } else {
      setLoading(false)
    }
  }, [user?.id])

  const fetchAddresses = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedAddresses: Address[] = (data || []).map(addr => ({
        id: addr.id,
        user_id: addr.user_id || user.id,
        name: addr.name,
        phone: addr.phone,
        addressLine1: addr.address_line1,
        addressLine2: addr.address_line2 || '',
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        isDefault: addr.is_default || false,
        created_at: addr.created_at ?? undefined,
        updated_at: addr.updated_at ?? undefined
      } as Address))

      setAddresses(transformedAddresses)
    } catch (error) {
      console.error('Error fetching addresses:', error)
      toast.error('Failed to load addresses')
    } finally {
      setLoading(false)
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<AddressFormData> = {}

    if (!formData.name.trim()) errors.name = 'Name is required'
    if (!formData.phone.trim()) errors.phone = 'Phone number is required'
    else if (!/^[+]?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number'
    }
    if (!formData.addressLine1.trim()) errors.addressLine1 = 'Address is required'
    if (!formData.city.trim()) errors.city = 'City is required'
    if (!formData.state.trim()) errors.state = 'State is required'
    if (!formData.pincode.trim()) errors.pincode = 'Pincode is required'
    else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      errors.pincode = 'Please enter a valid 6-digit pincode'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof AddressFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: 'Tamil Nadu',
      pincode: ''
    })
    setFormErrors({})
    setEditingAddress(null)
  }

  const handleAddAddress = async () => {
    if (!validateForm() || !user?.id) return

    try {
      setSubmitting(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('addresses')
        .insert({
          user_id: user.id,
          name: formData.name,
          phone: formData.phone,
          address_line1: formData.addressLine1,
          address_line2: formData.addressLine2 || null,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          is_default: addresses.length === 0
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Address added successfully')
      setShowForm(false)
      resetForm()
      await fetchAddresses()
    } catch (error) {
      console.error('Error adding address:', error)
      toast.error('Failed to add address')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditAddress = async () => {
    if (!validateForm() || !editingAddress || !user?.id) return

    try {
      setSubmitting(true)
      const supabase = createClient()

      const { error } = await supabase
        .from('addresses')
        .update({
          name: formData.name,
          phone: formData.phone,
          address_line1: formData.addressLine1,
          address_line2: formData.addressLine2 || null,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingAddress.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Address updated successfully')
      setShowForm(false)
      resetForm()
      await fetchAddresses()
    } catch (error) {
      console.error('Error updating address:', error)
      toast.error('Failed to update address')
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      name: address.name,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode
    })
    setShowForm(true)
  }

  const setDefaultAddress = async (id: string) => {
    if (!user?.id) return

    try {
      const supabase = createClient()

      // First, unset all defaults
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)

      // Then set the new default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Default address updated')
      await fetchAddresses()
    } catch (error) {
      console.error('Error setting default address:', error)
      toast.error('Failed to update default address')
    }
  }

  const deleteAddress = async (id: string) => {
    if (!user?.id) return

    if (addresses.length === 1) {
      toast.error('You must have at least one address')
      return
    }

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Address deleted successfully')
      await fetchAddresses()
    } catch (error) {
      console.error('Error deleting address:', error)
      toast.error('Failed to delete address')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Saved Addresses</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Address
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {editingAddress ? 'Edit Address' : 'Add New Address'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false)
                resetForm()
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Full Name *"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-black ${formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <input
                type="tel"
                placeholder="Phone Number * (+91 9876543210)"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-black ${formErrors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
            </div>

            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Address Line 1 * (House/Flat No, Street)"
                value={formData.addressLine1}
                onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-black ${formErrors.addressLine1 ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {formErrors.addressLine1 && <p className="text-red-500 text-sm mt-1">{formErrors.addressLine1}</p>}
            </div>

            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Address Line 2 (Area, Landmark - Optional)"
                value={formData.addressLine2}
                onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="City *"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-black ${formErrors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {formErrors.city && <p className="text-red-500 text-sm mt-1">{formErrors.city}</p>}
            </div>

            <div>
              <select
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-black ${formErrors.state ? 'border-red-500' : 'border-gray-300'
                  }`}
              >
                <option value="">Select State *</option>
                {indianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {formErrors.state && <p className="text-red-500 text-sm mt-1">{formErrors.state}</p>}
            </div>

            <div>
              <input
                type="text"
                placeholder="Pincode * (6 digits)"
                value={formData.pincode}
                onChange={(e) => handleInputChange('pincode', e.target.value)}
                maxLength={6}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-black ${formErrors.pincode ? 'border-red-500' : 'border-gray-300'
                  }`}
              />
              {formErrors.pincode && <p className="text-red-500 text-sm mt-1">{formErrors.pincode}</p>}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={editingAddress ? handleEditAddress : handleAddAddress}
              disabled={submitting}
              className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : (editingAddress ? 'Update Address' : 'Save Address')}
            </button>
            <button
              onClick={() => {
                setShowForm(false)
                resetForm()
              }}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2">No Saved Addresses</h3>
          <p className="text-gray-600 mb-6">Add your first address for faster checkout</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`border rounded-lg p-6 relative ${address.isDefault ? 'border-black bg-gray-50' : 'border-gray-200'
                }`}
            >
              {address.isDefault && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-black text-white px-2 py-1 rounded text-xs font-medium">
                  <Check className="w-3 h-3" />
                  Default
                </div>
              )}

              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">{address.name}</h3>
                  <p className="text-sm text-gray-600">{address.phone}</p>
                </div>
              </div>

              <p className="text-gray-700 mb-1">{address.addressLine1}</p>
              {address.addressLine2 && <p className="text-gray-700 mb-1">{address.addressLine2}</p>}
              <p className="text-gray-700">
                {address.city}, {address.state} - {address.pincode}
              </p>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                {!address.isDefault && (
                  <button
                    onClick={() => setDefaultAddress(address.id)}
                    className="text-sm text-black font-medium hover:underline"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => setViewingAddress(address)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                <button
                  onClick={() => startEdit(address)}
                  className="text-sm text-gray-600 hover:text-black font-medium flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => deleteAddress(address.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address View Modal */}
      {viewingAddress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Address Details</h3>
              <button
                onClick={() => setViewingAddress(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Name</label>
                <p className="text-gray-900">{viewingAddress.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="text-gray-900">{viewingAddress.phone}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className="text-gray-900">
                  {viewingAddress.addressLine1}
                  {viewingAddress.addressLine2 && <><br />{viewingAddress.addressLine2}</>}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">City</label>
                  <p className="text-gray-900">{viewingAddress.city}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">State</label>
                  <p className="text-gray-900">{viewingAddress.state}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Pincode</label>
                <p className="text-gray-900">{viewingAddress.pincode}</p>
              </div>

              {viewingAddress.isDefault && (
                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Default Address</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setViewingAddress(null)
                  startEdit(viewingAddress)
                }}
                className="flex-1 bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Edit Address
              </button>
              <button
                onClick={() => setViewingAddress(null)}
                className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
