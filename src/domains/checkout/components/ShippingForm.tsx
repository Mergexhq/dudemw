'use client'



interface ShippingFormData {
  email: string
  first_name: string
  last_name: string
  address_1: string
  address_2?: string
  city: string
  province?: string
  postal_code: string
  country_code: string
  phone?: string
}

interface TieredShippingInfo {
  option_name: string
  amount: number
  description: string
  is_tamil_nadu: boolean
  total_quantity: number
  estimated_delivery: string
}

interface ShippingFormProps {
  formData: ShippingFormData
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onSubmit: (e: React.FormEvent) => void
  isProcessing: boolean
  showShippingOptions: boolean
  isLoadingShipping: boolean
  tieredShipping: TieredShippingInfo | null
}

export default function ShippingForm({
  formData,
  onInputChange,
  onSubmit,
  isProcessing,
  showShippingOptions,
  isLoadingShipping,
  tieredShipping
}: ShippingFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Shipping Details</h2>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={onInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={onInputChange}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={onInputChange}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <input
          type="text"
          name="address_1"
          value={formData.address_1}
          onChange={onInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Apartment, suite, etc. (optional)</label>
        <input
          type="text"
          name="address_2"
          value={formData.address_2}
          onChange={onInputChange}
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={onInputChange}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Postal Code</label>
          <input
            type="text"
            name="postal_code"
            value={formData.postal_code}
            onChange={onInputChange}
            required
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Country</label>
        <select
          name="country_code"
          value={formData.country_code}
          onChange={onInputChange}
          required
          className="w-full px-4 py-2 border rounded-lg"
        >
          <option value="in">India</option>
          <option value="us">United States</option>
          <option value="ca">Canada</option>
          <option value="gb">United Kingdom</option>
        </select>
      </div>

      {/* Indian States Dropdown */}
      {formData.country_code === 'in' && (
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <select
            name="province"
            value={formData.province}
            onChange={onInputChange}
            required
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">Select State</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Arunachal Pradesh">Arunachal Pradesh</option>
            <option value="Assam">Assam</option>
            <option value="Bihar">Bihar</option>
            <option value="Chhattisgarh">Chhattisgarh</option>
            <option value="Goa">Goa</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Haryana">Haryana</option>
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Jharkhand">Jharkhand</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Kerala">Kerala</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Manipur">Manipur</option>
            <option value="Meghalaya">Meghalaya</option>
            <option value="Mizoram">Mizoram</option>
            <option value="Nagaland">Nagaland</option>
            <option value="Odisha">Odisha</option>
            <option value="Punjab">Punjab</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Sikkim">Sikkim</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Telangana">Telangana</option>
            <option value="Tripura">Tripura</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="West Bengal">West Bengal</option>
            <option value="Delhi">Delhi</option>
            <option value="Puducherry">Puducherry</option>
            <option value="Chandigarh">Chandigarh</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Phone Number *</label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={onInputChange}
          required
          placeholder="+91 9876543210"
          className="w-full px-4 py-2 border rounded-lg"
        />
      </div>



      <button
        type="submit"
        disabled={isProcessing || !showShippingOptions}
        className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
      >
        {isProcessing ? 'Processing...' : showShippingOptions ? 'Continue to Review' : 'Fill address to see delivery options'}
      </button>
    </form>
  )
}

export type { ShippingFormData, TieredShippingInfo }
