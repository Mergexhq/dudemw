import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogSelect } from '@/components/ui/dialog-select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Calendar as CalendarIcon, Eye, Edit, Trash2, Copy, Users, DollarSign, Percent } from 'lucide-react'
import { endOfMonth, endOfWeek, getLocalTimeZone, startOfMonth, startOfWeek, today, parseDate } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { DateRangePicker as AriaDateRangePicker, Dialog as AriaDialog, Group as AriaGroup, Popover as AriaPopover, useLocale } from "react-aria-components";
import { Button as BaseButton } from "@/components/base/buttons/button";
import { RangeCalendar } from "@/components/application/date-picker/range-calendar";
import { RangePresetButton } from "@/components/application/date-picker/range-preset";
import { cx } from "@/lib/utils/cx";
import { formatCurrency } from "@/lib/utils";

const now = today(getLocalTimeZone());

interface Coupon {
  id: string
  code: string
  discount_type: string
  discount_value: number
  usage_limit: number | null
  usage_count: number
  is_active: boolean
  expires_at: string | null
  created_at: string
  updated_at: string
}

type DialogMode = 'create' | 'view' | 'edit'

interface ExpiryDateRangePickerProps {
  value: { start: DateValue; end: DateValue } | null;
  onChange: (value: { start: DateValue; end: DateValue } | null) => void;
  disabled?: boolean;
}

function ExpiryDateRangePicker({ value, onChange, disabled }: ExpiryDateRangePickerProps) {
  const { locale } = useLocale();
  const [focusedValue, setFocusedValue] = useState<DateValue | null>(null);
  const [tempValue, setTempValue] = useState<{ start: DateValue; end: DateValue } | null>(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const presets = useMemo(
    () => ({
      today: { label: "Today", value: { start: now, end: now } },
      tomorrow: { label: "Tomorrow", value: { start: now.add({ days: 1 }), end: now.add({ days: 1 }) } },
      thisWeek: { label: "This week", value: { start: startOfWeek(now, locale), end: endOfWeek(now, locale) } },
      nextWeek: {
        label: "Next week",
        value: {
          start: startOfWeek(now, locale).add({ weeks: 1 }),
          end: endOfWeek(now, locale).add({ weeks: 1 }),
        },
      },
      thisMonth: { label: "This month", value: { start: startOfMonth(now), end: endOfMonth(now) } },
      nextMonth: {
        label: "Next month",
        value: {
          start: startOfMonth(now).add({ months: 1 }),
          end: endOfMonth(now).add({ months: 1 }),
        },
      },
    }),
    [locale]
  );

  if (disabled) {
    return (
      <div className="p-3 bg-gray-50 rounded-md border text-gray-700">
        {value ? `${value.start} – ${value.end}` : 'No expiry date set'}
      </div>
    );
  }

  return (
    <AriaDateRangePicker
      aria-label="Expiry date range"
      value={tempValue}
      onChange={setTempValue}
      shouldCloseOnSelect={false}
      onOpenChange={(isOpen) => {
        if (isOpen) {
          setTempValue(value);
        }
      }}
    >
      <AriaGroup>
        <BaseButton
          size="md"
          color="secondary"
          iconLeading={CalendarIcon}
          className="w-full justify-start text-left font-normal bg-white hover:bg-gray-50"
        >
          {value ? `${value.start} – ${value.end}` : <span className="text-gray-500">Pick a date range</span>}
        </BaseButton>
      </AriaGroup>
      <AriaPopover placement="bottom start" className={({ isEntering, isExiting }) =>
        cx(
          "origin-(--trigger-anchor-point) will-change-transform z-[100] max-w-none",
          isEntering &&
          "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
          isExiting &&
          "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
        )
      }>
        <AriaDialog className="flex rounded-xl bg-white shadow-xl ring-1 ring-gray-200 focus:outline-hidden">
          {({ close }) => (
            <>
              <div className="hidden w-28 flex-col gap-0.5 border-r border-solid border-gray-200 p-2 lg:flex">
                {Object.values(presets).map((preset) => (
                  <RangePresetButton
                    key={preset.label}
                    value={preset.value}
                    onClick={() => {
                      setFocusedValue(preset.value.start);
                      setTempValue(preset.value);
                    }}
                  >
                    {preset.label}
                  </RangePresetButton>
                ))}
              </div>
              <div className="flex flex-col">
                <RangeCalendar
                  focusedValue={focusedValue}
                  onFocusChange={setFocusedValue}
                />
                <div className="flex justify-end gap-2 border-t border-gray-200 p-2">
                  <BaseButton size="sm" color="secondary" onClick={() => {
                    setTempValue(value);
                    close();
                  }}>
                    Cancel
                  </BaseButton>
                  <BaseButton size="sm" color="primary" onClick={() => {
                    onChange(tempValue);
                    close();
                  }} className="bg-red-600 hover:bg-red-700 text-white">
                    Apply
                  </BaseButton>
                </div>
              </div>
            </>
          )}
        </AriaDialog>
      </AriaPopover>
    </AriaDateRangePicker>
  );
};

interface CouponDialogProps {
  mode: DialogMode
  coupon?: Coupon | null
  onSuccess?: () => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CouponDialog({ mode: initialMode, coupon, onSuccess, trigger, open: controlledOpen, onOpenChange }: CouponDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [mode, setMode] = useState<DialogMode>(initialMode)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [expiryDateRange, setExpiryDateRange] = useState<{ start: DateValue; end: DateValue } | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    usage_limit: '',
    is_active: true,
  })

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const supabase = createClient()

  // Reset form when dialog opens or coupon changes
  useEffect(() => {
    if (open) {
      setMode(initialMode)
      if (coupon) {
        setFormData({
          code: coupon.code,
          discount_type: coupon.discount_type,
          discount_value: String(coupon.discount_value),
          usage_limit: coupon.usage_limit ? String(coupon.usage_limit) : '',
          is_active: coupon.is_active,
        })
        if (coupon.expires_at) {
          try {
            const date = parseDate(coupon.expires_at.split('T')[0])
            setExpiryDateRange({ start: date, end: date })
          } catch {
            setExpiryDateRange(null)
          }
        } else {
          setExpiryDateRange(null)
        }
      } else {
        setFormData({
          code: '',
          discount_type: 'percentage',
          discount_value: '',
          usage_limit: '',
          is_active: true,
        })
        setExpiryDateRange(null)
      }
    }
  }, [open, coupon, initialMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || !formData.discount_value) {
      toast.error('Please fill in all required fields')
      return
    }

    if (parseFloat(formData.discount_value) <= 0) {
      toast.error('Discount value must be greater than 0')
      return
    }

    if (formData.discount_type === 'percentage' && parseFloat(formData.discount_value) > 100) {
      toast.error('Percentage discount cannot exceed 100%')
      return
    }

    setIsLoading(true)

    try {
      const couponData = {
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        is_active: formData.is_active,
        expires_at: expiryDateRange ? expiryDateRange.end.toDate(getLocalTimeZone()).toISOString() : null,
        updated_at: new Date().toISOString(),
      }

      if (mode === 'create') {
        const { error } = await supabase
          .from('coupons')
          .insert([{ ...couponData, usage_count: 0 }])

        if (error) {
          if (error.code === '23505') {
            toast.error('A coupon with this code already exists')
          } else {
            throw error
          }
          return
        }
        toast.success('Coupon created successfully!')
      } else if (mode === 'edit' && coupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', coupon.id)

        if (error) {
          if (error.code === '23505') {
            toast.error('A coupon with this code already exists')
          } else {
            throw error
          }
          return
        }
        toast.success('Coupon updated successfully!')
      }

      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error saving coupon:', error)
      toast.error('Failed to save coupon')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!coupon) return

    if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', coupon.id)

      if (error) throw error

      toast.success('Coupon deleted successfully')
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Error deleting coupon:', error)
      toast.error('Failed to delete coupon')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCopyCode = () => {
    if (!coupon) return
    navigator.clipboard.writeText(coupon.code)
    toast.success('Coupon code copied!')
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, code: result }))
  }

  const isExpired = coupon?.expires_at && new Date(coupon.expires_at) < new Date()
  const isViewMode = mode === 'view'

  const getTitle = () => {
    switch (mode) {
      case 'create': return 'Create New Coupon'
      case 'view': return 'Coupon Details'
      case 'edit': return 'Edit Coupon'
    }
  }

  const getDescription = () => {
    switch (mode) {
      case 'create': return 'Create a new discount coupon for your customers'
      case 'view': return 'View coupon details and usage statistics'
      case 'edit': return 'Update coupon settings'
    }
  }

  const defaultTrigger = mode === 'create' ? (
    <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25">
      <Plus className="mr-2 h-4 w-4" />
      Create Coupon
    </Button>
  ) : mode === 'view' ? (
    <Button variant="ghost" size="sm">
      <Eye className="h-4 w-4" />
    </Button>
  ) : (
    <Button variant="ghost" size="sm">
      <Edit className="h-4 w-4" />
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-40 bg-black/80"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />,
        document.body
      )}
      <DialogContent
        className="sm:max-w-[550px] border-0 shadow-none p-0 bg-transparent"
      >
        <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{getTitle()}</DialogTitle>
              {isViewMode && coupon && (
                <div className="flex items-center space-x-2">
                  <Badge variant={coupon.is_active && !isExpired ? 'default' : 'secondary'}>
                    {isExpired ? 'Expired' : coupon.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              )}
            </div>
            <DialogDescription>{getDescription()}</DialogDescription>
          </DialogHeader>

          {isViewMode && coupon ? (
            <div className="space-y-6 mt-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Discount</p>
                      <p className="text-xl font-bold text-gray-900">
                        {coupon.discount_type === 'percentage'
                          ? `${coupon.discount_value}%`
                          : formatCurrency(coupon.discount_value)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Times Used</p>
                      <p className="text-xl font-bold text-gray-900">
                        {coupon.usage_count}{coupon.usage_limit ? ` / ${coupon.usage_limit}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coupon Code */}
              <div className="p-4 bg-gray-100 rounded-lg text-center">
                <p className="text-sm text-gray-500 mb-2">Coupon Code</p>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl font-mono font-bold text-gray-900">{coupon.code}</span>
                  <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium capitalize">{coupon.discount_type}</p>
                </div>
                <div>
                  <p className="text-gray-500">Expires</p>
                  <p className={`font-medium ${isExpired ? 'text-red-600' : ''}`}>
                    {coupon.expires_at
                      ? new Date(coupon.expires_at).toLocaleDateString('en-IN')
                      : 'Never'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Created</p>
                  <p className="font-medium">
                    {new Date(coupon.created_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p className="font-medium">
                    {isExpired ? 'Expired' : coupon.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="flex-1 sm:flex-none"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => setMode('edit')}
                    className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <div className="flex space-x-2">
                  <Input
                    id="code"
                    placeholder="e.g., SAVE20"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    className="flex-1"
                    maxLength={20}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateRandomCode}
                    className="px-3"
                  >
                    Generate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Discount Type *</Label>
                  <DialogSelect
                    value={formData.discount_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, discount_type: value }))}
                    placeholder="Select discount type"
                    options={[
                      { value: "percentage", label: "Percentage (%)" },
                      { value: "fixed", label: "Fixed Amount (₹)" }
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '(₹)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    placeholder={formData.discount_type === 'percentage' ? '10' : '100'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                    min="0"
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    step={formData.discount_type === 'percentage' ? '0.1' : '1'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usage_limit">Usage Limit (optional)</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                  min="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date Range (optional)</Label>
                <div className="w-full">
                  <ExpiryDateRangePicker value={expiryDateRange} onChange={setExpiryDateRange} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Select a date range when this coupon should be valid. Leave empty for no expiry.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active immediately</Label>
              </div>

              <DialogFooter>
                {mode === 'edit' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMode('view')}
                  >
                    Back to Details
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? 'Saving...' : mode === 'create' ? 'Create Coupon' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Re-export the CreateCouponDialog for backwards compatibility
export function CreateCouponDialog({ onSuccess, trigger }: { onSuccess?: () => void; trigger?: React.ReactNode }) {
  return <CouponDialog mode="create" onSuccess={onSuccess} trigger={trigger} />
}

// View and Edit dialogs
export function ViewCouponDialog({ coupon, onSuccess, trigger }: { coupon: Coupon; onSuccess?: () => void; trigger?: React.ReactNode }) {
  return <CouponDialog mode="view" coupon={coupon} onSuccess={onSuccess} trigger={trigger} />
}

export function EditCouponDialog({ coupon, onSuccess, trigger }: { coupon: Coupon; onSuccess?: () => void; trigger?: React.ReactNode }) {
  return <CouponDialog mode="edit" coupon={coupon} onSuccess={onSuccess} trigger={trigger} />
}