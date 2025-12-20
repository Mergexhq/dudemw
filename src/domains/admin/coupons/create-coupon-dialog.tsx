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
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DialogSelect } from '@/components/ui/dialog-select'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'
import { endOfMonth, endOfWeek, getLocalTimeZone, startOfMonth, startOfWeek, today } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { DateRangePicker as AriaDateRangePicker, Dialog as AriaDialog, Group as AriaGroup, Popover as AriaPopover, useLocale } from "react-aria-components";
import { Button as BaseButton } from "@/components/base/buttons/button";
import { RangeCalendar } from "@/components/application/date-picker/range-calendar";
import { DateInput } from "@/components/application/date-picker/date-input";
import { RangePresetButton } from "@/components/application/date-picker/range-preset";
import { cx } from "@/lib/utils/cx";

const now = today(getLocalTimeZone());

interface ExpiryDateRangePickerProps {
  value: { start: DateValue; end: DateValue } | null;
  onChange: (value: { start: DateValue; end: DateValue } | null) => void;
}

function ExpiryDateRangePicker({ value, onChange }: ExpiryDateRangePickerProps) {
  const { locale } = useLocale();
  const [focusedValue, setFocusedValue] = useState<DateValue | null>(null);
  const [tempValue, setTempValue] = useState<{ start: DateValue; end: DateValue } | null>(value);

  // Sync tempValue when value prop changes (e.g., form reset for new coupon)
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
      thisYear: { label: "This year", value: { start: startOfMonth(now.set({ month: 1 })), end: endOfMonth(now.set({ month: 12 })) } },
      nextYear: {
        label: "Next year",
        value: {
          start: startOfMonth(now.set({ month: 1 }).add({ years: 1 })),
          end: endOfMonth(now.set({ month: 12 }).add({ years: 1 })),
        },
      },
    }),
    [locale]
  );

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
    </AriaDateRangePicker >
  );
};

interface CreateCouponDialogProps {
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function CreateCouponDialog({ onSuccess, trigger }: CreateCouponDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [expiryDateRange, setExpiryDateRange] = useState<{ start: DateValue; end: DateValue } | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: '',
    usage_limit: '',
    is_active: true,
  })

  const supabase = createClient()

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
        usage_count: 0,
        is_active: formData.is_active,
        expires_at: expiryDateRange ? expiryDateRange.end.toDate(getLocalTimeZone()).toISOString() : null,
      }

      const { error } = await supabase
        .from('coupons')
        .insert([couponData])

      if (error) {
        if (error.code === '23505') {
          toast.error('A coupon with this code already exists')
        } else {
          throw error
        }
        return
      }

      toast.success('Coupon created successfully!')
      setOpen(false)
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        usage_limit: '',
        is_active: true,
      })
      setExpiryDateRange(null)
      onSuccess?.()
    } catch (error) {
      console.error('Error creating coupon:', error)
      toast.error('Failed to create coupon')
    } finally {
      setIsLoading(false)
    }
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData(prev => ({ ...prev, code: result }))
  }

  const defaultTrigger = (
    <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25">
      <Plus className="mr-2 h-4 w-4" />
      Create Coupon
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
        className="sm:max-w-[500px] border-0 shadow-none p-0 bg-transparent"
      >
        <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-6">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
            <DialogDescription>
              Create a new discount coupon for your customers
            </DialogDescription>
          </DialogHeader>
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
                {isLoading ? 'Creating...' : 'Create Coupon'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}