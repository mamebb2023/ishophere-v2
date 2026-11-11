export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'cancelled'

export interface Category {
  id: string
  name: string
  slug: string
  sort_order: number
  created_at: string
}

export interface Item {
  id: string
  category_id: string | null
  name: string
  description: string | null
  price_cents: number
  stock: number
  image_url: string | null
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
  category?: Pick<Category, 'id' | 'name' | 'slug'> | null
}

export interface CartLine {
  id: string
  item_id: string
  quantity: number
  created_at: string
  item: Item | null
}

export interface OrderItem {
  id: string
  order_id: string
  item_id: string
  quantity: number
  unit_price_cents: number
  line_total_cents: number
  item?: Pick<Item, 'id' | 'name' | 'image_url'> | null
}

export interface Order {
  id: string
  user_id: string | null
  customer_name: string
  customer_phone: string
  customer_address: string | null
  status: OrderStatus
  total_cents: number
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
}

export interface ShopSettings {
  id: number
  shop_name: string
  primary_color: string
  secondary_color: string
  accent_color: string
  updated_at: string
}

export const DEFAULT_SETTINGS: ShopSettings = {
  id: 1,
  shop_name: 'iShopHere',
  primary_color: '#ea580c',
  secondary_color: '#f97316',
  accent_color: '#facc15',
  updated_at: new Date(0).toISOString(),
}
