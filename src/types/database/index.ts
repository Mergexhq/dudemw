// Re-export common types
export type { Json } from './common'

// Re-export CMS types
export type { AboutFeature, AboutStat, WhyDudeFeature } from './cms'

// Import all table types
import {
    ProductsTable,
    ProductVariantsTable,
    ProductImagesTable,
    ProductOptionsTable,
    ProductOptionValuesTable,
    VariantOptionValuesTable,
    ProductCategoriesTable,
    ProductCollectionsTable,
    ProductTagsTable,
    ProductTagAssignmentsTable,
    ProductAnalyticsTable,
    InventoryItemsTable,
    ReviewsTable,
} from './products'

import {
    CategoriesTable,
    CollectionsTable,
    CollectionProductsTable,
    HomepageSectionsTable,
    CmsPagesTable,
    BlogPostsTable,
} from './categories'
import { InventoryTable } from './inventory'

import {
    AboutFeaturesTable,
    AboutStatsTable,
    WhyDudeSectionsTable,
} from './cms'

import {
    OrdersTable,
    OrderItemsTable,
    ReturnsTable,
    AddressesTable,
    CouponsTable,
    CartItemsTable,
    WishlistTable,
} from './orders'

import {
    CampaignsTable,
    CampaignRulesTable,
    CampaignActionsTable,
    OrderDiscountsTable,
} from './campaigns'

import { WishlistsTable } from './wishlists'

import {
    CustomersTable,
    ProfilesTable,
    AdminProfilesTable,
    AuditLogsTable,
    CustomerActivityLogTable,
    CustomerAddressesTable,
    CustomerNotesTable,
} from './users'

import {
    BannersTable,
    AdvertisementsTable,
} from './banners'

import {
    StoreSettingsTable,
    SystemPreferencesTable,
    PaymentSettingsTable,
    TaxSettingsTable,
    SystemSettingsTable,
    InventorySettingsTable,
    ShippingZonesTable,
    ShippingRatesTable,
    ShippingRulesTable,
    StoreLocationsTable,
    CategoryTaxRulesTable,
} from './settings'

import {
    SuppliersTable,
    SupplierProductsTable,
} from './suppliers'

// Main Database type for Supabase
export type Database = {
    public: {
        Tables: {
            // Products
            products: ProductsTable
            product_variants: ProductVariantsTable
            product_images: ProductImagesTable
            product_options: ProductOptionsTable
            product_option_values: ProductOptionValuesTable
            variant_option_values: VariantOptionValuesTable
            product_categories: ProductCategoriesTable
            product_collections: ProductCollectionsTable
            product_tags: ProductTagsTable
            product_tag_assignments: ProductTagAssignmentsTable
            product_analytics: ProductAnalyticsTable
            inventory_items: InventoryItemsTable
            reviews: ReviewsTable

            // Categories & Collections
            categories: CategoriesTable
            collections: CollectionsTable
            collection_products: CollectionProductsTable
            homepage_sections: HomepageSectionsTable
            cms_pages: CmsPagesTable
            blog_posts: BlogPostsTable

            // CMS Content
            about_features: AboutFeaturesTable
            about_stats: AboutStatsTable
            why_dude_sections: WhyDudeSectionsTable

            // Orders & Cart
            orders: OrdersTable
            order_items: OrderItemsTable
            returns: ReturnsTable
            addresses: AddressesTable
            coupons: CouponsTable
            cart_items: CartItemsTable
            wishlist_items: WishlistTable

            // Campaigns & Discounts
            campaigns: CampaignsTable
            campaign_rules: CampaignRulesTable
            campaign_actions: CampaignActionsTable
            order_discounts: OrderDiscountsTable

            // Users & Customers
            customers: CustomersTable
            profiles: ProfilesTable
            admin_profiles: AdminProfilesTable
            audit_logs: AuditLogsTable
            customer_activity_log: CustomerActivityLogTable
            customer_addresses: CustomerAddressesTable
            customer_notes: CustomerNotesTable

            // Marketing
            banners: BannersTable
            advertisements: AdvertisementsTable

            // Settings
            store_settings: StoreSettingsTable
            system_preferences: SystemPreferencesTable
            payment_settings: PaymentSettingsTable
            tax_settings: TaxSettingsTable
            system_settings: SystemSettingsTable
            inventory_settings: InventorySettingsTable
            shipping_zones: ShippingZonesTable
            shipping_rates: ShippingRatesTable
            shipping_rules: ShippingRulesTable
            store_locations: StoreLocationsTable

            // Suppliers
            suppliers: SuppliersTable
            supplier_products: SupplierProductsTable
            inventory: InventoryTable
            category_tax_rules: CategoryTaxRulesTable

            // Wishlists (product-level)
            wishlists: WishlistsTable
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Helper types for table access
export type PublicSchema = Database['public']

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions['schema']]['Tables'])[TableName] extends {
        Row: infer R
    }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'])
    ? (PublicSchema['Tables'])[PublicTableNameOrOptions] extends {
        Row: infer R
    }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema['Enums']
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
    ? PublicSchema['Enums'][PublicEnumNameOrOptions]
    : never
