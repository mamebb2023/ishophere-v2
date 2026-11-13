export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'cancelled'

export type StoreRole = 'owner' | 'staff'

export interface Store {
  id: string
  name: string
  slug: string
  description: string
  primary_color: string
  secondary_color: string
  accent_color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StoreMembership {
  store_id: string
  user_id: string
  role: StoreRole
  display_name: string
  created_at: string
  store?: Store | null
}

export interface DevStoreRow extends Store {
  owner_name: string | null
  owner_email: string | null
  staff_count: number
}

export interface Category {
  id: string
  store_id: string
  name: string
  slug: string
  sort_order: number
  created_at: string
}

export interface Item {
  id: string
  store_id: string
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
  user_id: string
  store_id: string
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
  store_id: string
  user_id: string | null
  customer_name: string
  customer_phone: string
  customer_address: string | null
  status: OrderStatus
  total_cents: number
  created_at: string
  updated_at: string
  order_items?: OrderItem[]
  store?: Pick<Store, 'id' | 'name' | 'slug'> | null
}

export type NotificationType = 'order_placed' | 'order_status'

export interface Notification {
  id: string
  user_id: string
  store_id: string
  order_id: string | null
  type: NotificationType
  title: string
  body: string | null
  read_at: string | null
  created_at: string
  store?: Pick<Store, 'name' | 'slug'> | null
}

export const DEFAULT_STORE_SLUG = 'demo'

export const DEFAULT_STORE_COLORS = {
  primary_color: '#1d813e',
  secondary_color: '#50cc60',
  accent_color: '#96ee89',
} as const
