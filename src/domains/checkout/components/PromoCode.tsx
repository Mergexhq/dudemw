'use client'

import { useState } from 'react'
import { useToast } from '@/lib/layout/feedback/ToastContext'
import { validateCoupon } from '@/app/actions/coupons'

interface PromoCodeProps {
    onApplied?: (discount: { code: string; amount: number } | null) => void
    cartTotal: number
}

export default function PromoCode({ onApplied, cartTotal }: PromoCodeProps) {
    const [code, setCode] = useState('')
    const [isApplying, setIsApplying] = useState(false)
    const [appliedCode, setAppliedCode] = useState<string | null>(null)
    const { showToast } = useToast()

    const handleApply = async () => {
        if (!code.trim()) {
            showToast('Please enter a promo code', 'error')
            return
        }

        setIsApplying(true)

        try {
            const result = await validateCoupon(code, cartTotal)

            if (!result.isValid || !result.coupon) {
                throw new Error(result.error || 'Invalid promo code')
            }

            setAppliedCode(result.coupon.code)
            setCode('')
            showToast('Promo code applied successfully!', 'success')
            onApplied?.({
                code: result.coupon.code,
                amount: result.coupon.discountAmount
            })
        } catch (error: any) {
            console.error('Failed to apply promo code:', error)
            showToast(error.message || 'Invalid promo code', 'error')
            onApplied?.(null)
        } finally {
            setIsApplying(false)
        }
    }

    const handleRemove = async () => {
        if (!appliedCode) return

        setIsApplying(true)

        try {
            setAppliedCode(null)
            showToast('Promo code removed', 'info')
            onApplied?.(null)
        } catch (error: any) {
            console.error('Failed to remove promo code:', error)
            showToast('Failed to remove promo code', 'error')
        } finally {
            setIsApplying(false)
        }
    }

    return (
        <div className="border rounded-lg p-4 bg-white">
            <h3 className="font-semibold mb-3">Promo Code</h3>

            {appliedCode ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <div>
                        <span className="font-medium text-green-800">{appliedCode}</span>
                        <span className="text-sm text-green-600 ml-2">Applied</span>
                    </div>
                    <button
                        onClick={handleRemove}
                        disabled={isApplying}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                        Remove
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="flex-1 min-w-0 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black uppercase placeholder:normal-case"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleApply()
                            }
                        }}
                    />
                    <button
                        onClick={handleApply}
                        disabled={isApplying || !code.trim()}
                        className="w-[30%] sm:w-auto sm:min-w-[100px] px-3 sm:px-4 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all"
                    >
                        {isApplying ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            'Apply'
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}

