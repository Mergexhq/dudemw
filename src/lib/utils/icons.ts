import { 
    Shirt, 
    Truck, 
    RotateCcw, 
    BadgeCheck, 
    Heart, 
    Shield, 
    Star, 
    Zap, 
    Award, 
    Clock, 
    Gift, 
    Headphones,
    LucideIcon
} from "lucide-react"

export const AVAILABLE_ICONS: Record<string, LucideIcon> = {
    shirt: Shirt,
    truck: Truck,
    'rotate-ccw': RotateCcw,
    'badge-check': BadgeCheck,
    heart: Heart,
    shield: Shield,
    star: Star,
    zap: Zap,
    award: Award,
    clock: Clock,
    gift: Gift,
    headphones: Headphones,
}

export const ICON_OPTIONS = [
    { value: 'shirt', label: 'Shirt (Premium Quality)' },
    { value: 'truck', label: 'Truck (Fast Shipping)' },
    { value: 'rotate-ccw', label: 'Return (Easy Returns)' },
    { value: 'badge-check', label: 'Badge Check (Verified)' },
    { value: 'heart', label: 'Heart (Customer Love)' },
    { value: 'shield', label: 'Shield (Protection/Warranty)' },
    { value: 'star', label: 'Star (Quality/Rating)' },
    { value: 'zap', label: 'Zap (Fast/Instant)' },
    { value: 'award', label: 'Award (Achievement)' },
    { value: 'clock', label: 'Clock (24/7 Service)' },
    { value: 'gift', label: 'Gift (Special Offers)' },
    { value: 'headphones', label: 'Headphones (Support)' },
]

export function getIconComponent(iconName: string): LucideIcon {
    return AVAILABLE_ICONS[iconName] || BadgeCheck
}