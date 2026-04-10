export type Role = 'USER' | 'COOK' 

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED'

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

export interface User {
  id: string
  email?: string
  phone: string
  firstName: string
  lastName?: string
  avatarUrl?: string
  role: Role
  cook?: Cook
}

export interface Cook {
  id: string
  userId: string
  businessName: string
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
  paymentStatus: PaymentStatus
  items: OrderItem[]
  cook?: Cook
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
