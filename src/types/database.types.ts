export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line1: string
          city: string
          created_at: string | null
          guest_id: string | null
          id: string
          name: string
          phone: string
          pincode: string
          state: string
          user_id: string | null
        }
        Insert: {
          address_line1: string
          city: string
          created_at?: string | null
          guest_id?: string | null
          id?: string
          name: string
          phone: string
          pincode: string
          state: string
          user_id?: string | null
        }
        Update: {
          address_line1?: string
          city?: string
          created_at?: string | null
          guest_id?: string | null
          id?: string
          name?: string
          phone?: string
          pincode?: string
          state?: string
          user_id?: string | null
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          placement: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          placement?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          placement?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string | null
          guest_id: string | null
          id: string
          quantity: number
          user_id: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          quantity?: number
          user_id?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          quantity?: number
          user_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          name: string
          parent_id: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_products: {
        Row: {
          collection_id: string | null
          created_at: string | null
          id: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          id?: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          rule_json: Json | null
          slug: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          rule_json?: Json | null
          slug: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          rule_json?: Json | null
          slug?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          collection_id: string | null
          created_at: string | null
          end_at: string | null
          id: string
          is_active: boolean | null
          layout: string | null
          position: number
          start_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean | null
          layout?: string | null
          position: number
          start_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean | null
          layout?: string | null
          position?: number
          start_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homepage_sections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          allow_backorders: boolean | null
          available_quantity: number | null
          barcode: string | null
          cost: number | null
          created_at: string | null
          id: string
          low_stock_threshold: number | null
          quantity: number | null
          reserved_quantity: number | null
          sku: string | null
          track_quantity: boolean | null
          updated_at: string | null
          variant_id: string
        }
        Insert: {
          allow_backorders?: boolean | null
          available_quantity?: number | null
          barcode?: string | null
          cost?: number | null
          created_at?: string | null
          id?: string
          low_stock_threshold?: number | null
          quantity?: number | null
          reserved_quantity?: number | null
          sku?: string | null
          track_quantity?: boolean | null
          updated_at?: string | null
          variant_id: string
        }
        Update: {
          allow_backorders?: boolean | null
          available_quantity?: number | null
          barcode?: string | null
          cost?: number | null
          created_at?: string | null
          id?: string
          low_stock_threshold?: number | null
          quantity?: number | null
          reserved_quantity?: number | null
          sku?: string | null
          track_quantity?: boolean | null
          updated_at?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_logs: {
        Row: {
          change_amount: number
          created_at: string | null
          id: string
          reason: string
          variant_id: string
        }
        Insert: {
          change_amount: number
          created_at?: string | null
          id?: string
          reason: string
          variant_id: string
        }
        Update: {
          change_amount?: number
          created_at?: string | null
          id?: string
          reason?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_logs_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string | null
          id: string
          low_stock_alert_enabled: boolean | null
          low_stock_threshold: number | null
          order_confirmation_enabled: boolean | null
          refund_notification_enabled: boolean | null
          shipment_update_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          low_stock_alert_enabled?: boolean | null
          low_stock_threshold?: number | null
          order_confirmation_enabled?: boolean | null
          refund_notification_enabled?: boolean | null
          shipment_update_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          low_stock_alert_enabled?: boolean | null
          low_stock_threshold?: number | null
          order_confirmation_enabled?: boolean | null
          refund_notification_enabled?: boolean | null
          shipment_update_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          quantity: number
          variant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          quantity: number
          variant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          quantity?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          guest_email: string | null
          guest_id: string | null
          id: string
          order_status: string | null
          payment_status: string | null
          razorpay_order_id: string | null
          shipping_address_id: string | null
          shipping_amount: number | null
          shipping_provider: string | null
          shipping_tracking_number: string | null
          shipping_zone: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          guest_email?: string | null
          guest_id?: string | null
          id?: string
          order_status?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          shipping_address_id?: string | null
          shipping_amount?: number | null
          shipping_provider?: string | null
          shipping_tracking_number?: string | null
          shipping_zone?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          guest_email?: string | null
          guest_id?: string | null
          id?: string
          order_status?: string | null
          payment_status?: string | null
          razorpay_order_id?: string | null
          shipping_address_id?: string | null
          shipping_amount?: number | null
          shipping_provider?: string | null
          shipping_tracking_number?: string | null
          shipping_zone?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          is_enabled: boolean | null
          provider: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          id?: string
          is_enabled?: boolean | null
          provider: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          is_enabled?: boolean | null
          provider?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          payment_id: string | null
          provider: string
          raw_response: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          payment_id?: string | null
          provider?: string
          raw_response?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          payment_id?: string | null
          provider?: string
          raw_response?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_collections: {
        Row: {
          collection_id: string
          created_at: string | null
          id: string
          position: number | null
          product_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string | null
          id?: string
          position?: number | null
          product_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string | null
          id?: string
          position?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_collections_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          height: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          product_id: string
          sort_order: number | null
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          height?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          product_id: string
          sort_order?: number | null
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          height?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          product_id?: string
          sort_order?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          created_at: string | null
          hex_color: string | null
          id: string
          name: string
          option_id: string
          position: number | null
        }
        Insert: {
          created_at?: string | null
          hex_color?: string | null
          id?: string
          name: string
          option_id: string
          position?: number | null
        }
        Update: {
          created_at?: string | null
          hex_color?: string | null
          id?: string
          name?: string
          option_id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string | null
          id: string
          name: string
          position: number | null
          product_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          position?: number | null
          product_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          position?: number | null
          product_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tag_assignments: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tag_assignments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "product_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          active: boolean | null
          created_at: string | null
          discount_price: number | null
          id: string
          name: string | null
          position: number | null
          price: number
          product_id: string
          sku: string
          stock: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          discount_price?: number | null
          id?: string
          name?: string | null
          position?: number | null
          price: number
          product_id: string
          sku: string
          stock?: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          discount_price?: number | null
          id?: string
          name?: string | null
          position?: number | null
          price?: number
          product_id?: string
          sku?: string
          stock?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_backorders: boolean | null
          brand: string | null
          category_id: string | null
          colors: string[] | null
          compare_price: number | null
          cost: number | null
          created_at: string | null
          description: string | null
          global_stock: number | null
          highlights: string[] | null
          id: string
          images: string[] | null
          in_stock: boolean | null
          is_bestseller: boolean | null
          is_new_drop: boolean | null
          low_stock_threshold: number | null
          meta_description: string | null
          meta_title: string | null
          original_price: number | null
          price: number
          sizes: string[] | null
          slug: string
          status: string | null
          subtitle: string | null
          taxable: boolean | null
          title: string
          track_inventory: boolean | null
          updated_at: string | null
          url_handle: string | null
        }
        Insert: {
          allow_backorders?: boolean | null
          brand?: string | null
          category_id?: string | null
          colors?: string[] | null
          compare_price?: number | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          global_stock?: number | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_bestseller?: boolean | null
          is_new_drop?: boolean | null
          low_stock_threshold?: number | null
          meta_description?: string | null
          meta_title?: string | null
          original_price?: number | null
          price?: number
          sizes?: string[] | null
          slug: string
          status?: string | null
          subtitle?: string | null
          taxable?: boolean | null
          title: string
          track_inventory?: boolean | null
          updated_at?: string | null
          url_handle?: string | null
        }
        Update: {
          allow_backorders?: boolean | null
          brand?: string | null
          category_id?: string | null
          colors?: string[] | null
          compare_price?: number | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          global_stock?: number | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          is_bestseller?: boolean | null
          is_new_drop?: boolean | null
          low_stock_threshold?: number | null
          meta_description?: string | null
          meta_title?: string | null
          original_price?: number | null
          price?: number
          sizes?: string[] | null
          slug?: string
          status?: string | null
          subtitle?: string | null
          taxable?: boolean | null
          title?: string
          track_inventory?: boolean | null
          updated_at?: string | null
          url_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean
          max_quantity: number
          price: number
          provider: string
          updated_at: string | null
          zone: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          max_quantity: number
          price: number
          provider?: string
          updated_at?: string | null
          zone: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean
          max_quantity?: number
          price?: number
          provider?: string
          updated_at?: string | null
          zone?: string
        }
        Relationships: []
      }
      shipping_settings: {
        Row: {
          cod_enabled: boolean | null
          created_at: string | null
          delivery_estimate_text: string | null
          flat_rate: number | null
          free_shipping_min: number | null
          id: string
          updated_at: string | null
        }
        Insert: {
          cod_enabled?: boolean | null
          created_at?: string | null
          delivery_estimate_text?: string | null
          flat_rate?: number | null
          free_shipping_min?: number | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          cod_enabled?: boolean | null
          created_at?: string | null
          delivery_estimate_text?: string | null
          flat_rate?: number | null
          free_shipping_min?: number | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      store_locations: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          name: string
          pincode: string
          state: string
          updated_at: string | null
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name: string
          pincode: string
          state: string
          updated_at?: string | null
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name?: string
          pincode?: string
          state?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          created_at: string | null
          currency: string
          gst_number: string | null
          id: string
          invoice_prefix: string | null
          legal_name: string | null
          logo_url: string | null
          privacy_url: string | null
          store_name: string
          support_email: string | null
          support_phone: string | null
          terms_url: string | null
          timezone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          gst_number?: string | null
          id?: string
          invoice_prefix?: string | null
          legal_name?: string | null
          logo_url?: string | null
          privacy_url?: string | null
          store_name?: string
          support_email?: string | null
          support_phone?: string | null
          terms_url?: string | null
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          gst_number?: string | null
          id?: string
          invoice_prefix?: string | null
          legal_name?: string | null
          logo_url?: string | null
          privacy_url?: string | null
          store_name?: string
          support_email?: string | null
          support_phone?: string | null
          terms_url?: string | null
          timezone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tax_settings: {
        Row: {
          created_at: string | null
          default_gst_rate: number
          gstin: string
          id: string
          price_includes_tax: boolean
          store_state: string
          tax_enabled: boolean
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_gst_rate: number
          gstin: string
          id?: string
          price_includes_tax: boolean
          store_state: string
          tax_enabled: boolean
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_gst_rate?: number
          gstin?: string
          id?: string
          price_includes_tax?: boolean
          store_state?: string
          tax_enabled?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      category_tax_rules: {
        Row: {
          category_id: string
          created_at: string | null
          gst_rate: number
          id: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          gst_rate: number
          id?: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          gst_rate?: number
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_tax_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_option_values: {
        Row: {
          created_at: string | null
          id: string
          option_value_id: string
          variant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_value_id: string
          variant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_value_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_option_values_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "product_option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_option_values_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_prices: {
        Row: {
          amount: number
          compare_at_amount: number | null
          cost: number | null
          created_at: string | null
          id: string
          price_type: string
          updated_at: string | null
          variant_id: string
        }
        Insert: {
          amount: number
          compare_at_amount?: number | null
          cost?: number | null
          created_at?: string | null
          id?: string
          price_type?: string
          updated_at?: string | null
          variant_id: string
        }
        Update: {
          amount?: number
          compare_at_amount?: number | null
          cost?: number | null
          created_at?: string | null
          id?: string
          price_type?: string
          updated_at?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_prices_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          created_at: string | null
          guest_id: string | null
          id: string
          product_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          product_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          guest_id?: string | null
          id?: string
          product_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_user: { Args: never; Returns: boolean }
      is_owner_user: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
