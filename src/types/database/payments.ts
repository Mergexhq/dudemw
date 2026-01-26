import { Json } from './common'

export interface PaymentsTable {
    Row: {
        id: string
        order_id: string
        provider: string | null
        payment_id: string | null
        status: string | null
        raw_response: Json | null
        created_at: string | null
    }
    Insert: {
        id?: string
        order_id: string
        provider?: string | null
        payment_id?: string | null
        status?: string | null
        raw_response?: Json | null
        created_at?: string | null
    }
    Update: {
        id?: string
        order_id?: string
        provider?: string | null
        payment_id?: string | null
        status?: string | null
        raw_response?: Json | null
        created_at?: string | null
    }
    Relationships: [
        {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
        }
    ]
}
