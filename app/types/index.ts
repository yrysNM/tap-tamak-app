export type Role = 'USER' | 'COOK' 

export type OrderStatus =
  | 'PENDING'
  | 'AWAITING_COOK_ACCEPTANCE'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'COOKING'
  | 'PREPARING'
  | 'READY'
  | 'COURIER_NEARBY'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REJECTED'

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'

export type PaymentProvider = 'KASPI' | 'HALYK' | 'FREEDOM'

export type VerificationStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'

/** GET /cooks/me/verification — `businessName` exists on the payload but must not be shown on the verification screen. */
export interface CookVerificationDocuments {
  kitchenPhotoUrls?: string[]
  certificateUrl?: string
  rejectionReason?: string
  submittedAt?: string
  [key: string]: unknown
}

export interface CookVerificationGetResponse {
  verificationStatus: VerificationStatus
  businessName?: string
  documents: CookVerificationDocuments | null
}

export interface CookVerificationSubmitPayload {
  kitchenPhotos: File[]
  certificate: File
  latitude: number
  longitude: number
}

export interface CookSchedule {
  workStartAt: string | null
  workEndAt: string | null
  isActiveNow: boolean
}

export interface CookScheduleGetResponse {
  data: CookSchedule
}

export interface CookSchedulePatchPayload {
  workStartAt: string
  workEndAt: string
}

export interface User {
  id: string
  email?: string
  phone: string
  firstName: string
  lastName?: string
  avatarUrl?: string
  role: Role
}

export interface Cook {
  id: string
  userId: string
  businessName: string
  profileImageUrl?: string
  bio?: string
  specialties: string[]
  kitchenPhotoUrls: string[]
  verificationStatus: VerificationStatus
  isAvailable: boolean
  latitude?: number
  longitude?: number
  preparationTimeMin: number
  minimumOrder: number
  deliveryRadius: number
  rating: number
  totalReviews: number
  /** Total dishes in the cook's catalog (GET /cooks). */
  countDishes?: number
}

export type PreparationType = 'FAST' | 'LONG'

/** Dish payload from cook APIs: GET/POST `/dishes`, GET `/dishes/:id`. */
export interface CookDish {
  id: string
  name: string
  description?: string
  price: number
  cookingTime: number
  preparationType: PreparationType
  imageUrl?: string
  category?: string
  isAvailable?: boolean
  calories?: number
  portionCount?: number
  [key: string]: unknown
}

export interface PublicCookMenuCookInfo {
  id: string
  businessName: string
  profileImageUrl?: string
  bio?: string | null
  rating: number
  totalReviews: number
  latitude?: number
  longitude?: number
  isAvailable: boolean
  kitchenPhotoUrls: string[]
}

export interface PublicCookMenuInfo {
  id: string
  date: string
}

export interface PublicCookMenuDish extends CookDish {}

export interface PublicCookMenuPayload {
  cook: PublicCookMenuCookInfo
  menu: PublicCookMenuInfo | null
  dishes: PublicCookMenuDish[]
}

export interface Dish {
  id: string
  cookId: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  category: string
  tags: string[]
  isAvailable: boolean
  preparationTime?: number
  calories?: number
  weight?: number
  rating: number
  orderCount: number
  /** Present on some public list/detail payloads */
  cook?: Pick<Cook, 'id' | 'businessName'>
}

export interface OrderItem {
  id: string
  dishId: string
  quantity: number
  price: number
  name: string
  dish?: Dish
}

export interface Order {
  id: string
  orderNumber: string
  userId: string
  cookId: string
  status: OrderStatus
  totalAmount: number
  deliveryFee: number
  deliveryAddress: string
  /** Customer phone from checkout; used on cook-facing order views. */
  contactPhone?: string
  paymentStatus: PaymentStatus
  items: OrderItem[]
  cook?: Cook
  createdAt?: string
  updatedAt?: string
  /** Optional minutes-to-ready estimate from the backend. */
  estimatedMinutes?: number | null
}

export interface Review {
  id: string
  userId: string
  cookId: string
  orderId: string
  rating: number
  comment?: string
  reply?: string
  repliedAt?: string
  photoUrls: string[]
  user?: User
}

export interface CartItem {
  dish: Dish
  quantity: number
}

/** Snapshot for checkout UI (persisted cart). */
export interface CartLineCook {
  id: string
  businessName: string
  profileImageUrl?: string
  rating: number
  totalReviews: number
  kitchenPhotoUrls: string[]
}

export interface CartLineDish {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  cookingTime?: number
  calories?: number
  portionCount?: number
}

export interface CartLineItem {
  cook: CartLineCook
  dish: CartLineDish
  quantity: number
  addedAt: string
}

/** GET /basket — cook summary (mapCookSummary). */
export interface BasketCookSummary {
  id: string
  businessName: string
  profileImageUrl?: string
  bio?: string | null
  rating: number
  totalReviews: number
  latitude?: number
  longitude?: number
  isAvailable: boolean
  kitchenPhotoUrls: string[]
}

/** Dish snapshot on a basket line from GET /basket. */
export interface BasketLineDish {
  id: string
  name: string
  description?: string
  price: number
  imageUrl?: string
  isAvailable: boolean
  portionCount?: number
  cookId: string
}

export interface BasketLineItem {
  id: string
  dishId: string
  quantity: number
  lineSubtotal: number
  dish: BasketLineDish
}

export interface BasketCookGroup {
  cookId: string
  cook: BasketCookSummary
  items: BasketLineItem[]
  itemsCount: number
  itemsTotal: number
}

/** GET /basket */
export interface BasketGetResponse {
  cookId: string | null
  cook: BasketCookSummary | null
  groups: BasketCookGroup[]
  items: BasketLineItem[]
  itemsCount: number
  itemsTotal: number
}

export interface Address {
  id: string
  userId: string
  label: string
  street: string
  apartment?: string
  city: string
  latitude: number
  longitude: number
  isDefault: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface LoginDto {
  email?: string
  phone?: string
  password: string
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RegisterDto {
  firstName: string
  lastName?: string
  phone: string
  password: string
  role: 'USER' | 'COOK'
}
