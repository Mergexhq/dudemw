'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle } from 'lucide-react'
import AuthLayout from '../components/AuthLayout'
import SocialLogin from '../components/SocialLogin'
import Divider from '../components/Divider'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [acceptTerms, setAcceptTerms] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!')
      return
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      if (data.user) {
        // OTP verification disabled temporarily - redirect to homepage
        router.push('/')
      }
    } catch (err: any) {
      setError('Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join Dude Mens Wear and start shopping"
    >
      {/* Social Login */}
      <SocialLogin />

      <Divider />

      {/* Error Message */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2"
          data-testid="store-signup-error"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Vignesh Kumar"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              required
              data-testid="store-signup-email"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+91 9876543210"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Create a strong password"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 8 characters
          </p>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Re-enter your password"
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Terms & Conditions */}
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="w-4 h-4 mt-1 border-gray-300 rounded text-red-600 focus:ring-red-600"
            required
          />
          <span className="text-sm text-gray-700">
            I agree to the{' '}
            <Link href="/terms" className="text-red-600 font-medium hover:underline">
              Terms & Conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-red-600 font-medium hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-heading font-semibold tracking-wide hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="store-signup-submit"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      {/* Login Link */}
      <p className="text-center text-sm text-gray-600 mt-6">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-red-600 font-semibold hover:underline">
          Login
        </Link>
      </p>
    </AuthLayout>
  )
}
